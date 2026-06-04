'use client'

import { useState, useEffect, useMemo } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, CreditCard, Tag, Calendar, Clock, ChevronRight, ArrowLeft, User, MapPin, FileText, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPromoDiscount } from '@/components/promo-banner'
import { ADD_ON_OPTIONS, AddOnId, calculateCheckoutPricing, formatCents, SERVICE_OPTIONS, ServiceType } from '@/lib/checkout-pricing'
import { COMPANY_INFO } from '@/lib/constants'
import { useLeadCapture } from '@/hooks/use-lead-capture'

const occupancyOptions = [
  { value: '', label: 'Select occupancy status...' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'tenant-occupied', label: 'Tenant Occupied' },
]

const howHeardOptions = [
  { value: '', label: "How'd you find us?" },
  { value: 'google', label: 'Google Search' },
  { value: 'google-maps', label: 'Google Maps' },
  { value: 'referral', label: 'Friend or Family Referral' },
  { value: 'real-estate-agent', label: 'Real Estate Agent' },
  { value: 'home-inspector', label: 'Home Inspector' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'repeat-customer', label: 'Repeat Customer' },
  { value: 'other', label: 'Other' },
]

const serviceTypes = SERVICE_OPTIONS

interface TimeSlot {
  start: string;
  end: string;
  display: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  dayName: string;
  displayDate: string;
  slots: TimeSlot[];
  hasAvailableSlots: boolean;
}

type Step = 'job-details' | 'datetime' | 'client-details' | 'review'

function getOrdinalSuffix(day: number) {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export default function ContactForm() {
  const [currentStep, setCurrentStep] = useState<Step>('job-details')
  const [formData, setFormData] = useState({
    serviceType: 'sewer-inspection',
    occupancy: '',
    propertyAccess: '',
    cleanoutLocation: '',
    referrerName: '',
    buyersAgent: '',
    listingAgent: '',
    howHeardAboutUs: '',
    promoCode: '',
    selectedDate: '',
    selectedTimeSlot: null as TimeSlot | null,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: 'INDIANAPOLIS',
    state: 'Indiana',
    zipCode: '',
    directions: '',
    agreeToTerms: false,
    subscribeNewsletter: false,
    accessVerified: false,
    addOns: [] as AddOnId[],
  })

  const { captureField, markConverted } = useLeadCapture('booking-form')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState<{ code: string; amount: number } | null>(null)
  const [showTerms, setShowTerms] = useState(false)

  // Calendar state
  const [availability, setAvailability] = useState<DayAvailability[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [calendarError, setCalendarError] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    let savedDraft: Partial<typeof formData> = {}
    try {
      const storedDraft = sessionStorage.getItem('psiBookingDraft')
      if (storedDraft) {
        savedDraft = JSON.parse(storedDraft)
      }
    } catch {
      sessionStorage.removeItem('psiBookingDraft')
    }

    const discount = getPromoDiscount()
    if (discount) {
      setPromoDiscount(discount)
    }

    setFormData(prev => ({
      ...prev,
      ...savedDraft,
      agreeToTerms: false,
      promoCode: discount?.code || savedDraft.promoCode || prev.promoCode,
    }))
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem('psiBookingDraft', JSON.stringify({ ...formData, agreeToTerms: false }))
    } catch {
      // Draft persistence is best-effort; checkout must continue even if storage is unavailable.
    }
  }, [formData])

  useEffect(() => {
    if (currentStep === 'datetime' && availability.length === 0) {
      fetchAvailability()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const fetchAvailability = async () => {
    setIsLoadingSlots(true)
    setCalendarError('')
    try {
      const response = await fetch('/api/calendar/availability')
      const data = await response.json()
      if (data.success) {
        setAvailability(data.availability)
        const firstAvailable = data.availability.find((d: DayAvailability) => d.hasAvailableSlots)
        if (firstAvailable) {
          setFormData(prev => ({ ...prev, selectedDate: firstAvailable.date }))
        }
      } else {
        setCalendarError(data.error || 'Failed to load availability')
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setCalendarError('Failed to load available times. Please try again.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      serviceType: e.target.value as ServiceType,
      accessVerified: false,
    }))
  }

  const toggleAddOn = (addOnId: AddOnId, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      addOns: checked
        ? Array.from(new Set([...prev.addOns, addOnId]))
        : prev.addOns.filter(id => id !== addOnId),
    }))
  }

  // Lead capture on blur for key fields
  const handleLeadBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!value.trim()) return
    const fieldMap: Record<string, string> = {
      email: 'email',
      firstName: 'name',
      phone: 'phone',
      streetAddress: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip',
    }
    const captureKey = fieldMap[name]
    if (captureKey) {
      const payload: Record<string, string> = { [captureKey]: value.trim() }
      // Also send name as first + last if we have both
      if (captureKey === 'name' && formData.lastName) {
        payload.name = `${value.trim()} ${formData.lastName}`
      }
      // Always include email/phone if available for upsert
      if (formData.email && captureKey !== 'email') payload.email = formData.email
      if (formData.phone && captureKey !== 'phone') payload.phone = formData.phone
      captureField(payload)
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return
    setFormData(prev => ({ ...prev, selectedTimeSlot: slot }))
  }

  const handleDateSelect = (date: string) => {
    setFormData(prev => ({ ...prev, selectedDate: date, selectedTimeSlot: null }))
  }

  const activePromoCode = promoDiscount?.code || formData.promoCode
  const pricing = calculateCheckoutPricing(formData.serviceType, formData.addOns, activePromoCode)
  const getAccessVerificationCopy = () => {
    if (formData.serviceType === 'sewer-inspection-toilet') {
      return 'I confirm toilet pull/reset access is needed and approve the +$65 charge, including a new wax ring and supply line.'
    }
    if (formData.serviceType === 'sewer-inspection-roof') {
      return 'I confirm roof vent access is needed and approve the +$50 roof vent access charge.'
    }
    return 'I verified a usable cleanout is accessible. If it is not accessible on-site, I understand alternate access or trip fees may apply.'
  }

  const validateStep = (step: Step): boolean => {
    if (step === 'job-details') {
      if (!formData.occupancy) {
        toast.error('Please select occupancy status')
        return false
      }
      if (!formData.accessVerified) {
        toast.error('Please verify the selected access method and any related charges')
        return false
      }
      return true
    }
    if (step === 'datetime') {
      if (!formData.selectedDate || !formData.selectedTimeSlot) {
        toast.error('Please select an appointment date and time')
        return false
      }
      return true
    }
    if (step === 'client-details') {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.streetAddress) {
        toast.error('Please fill in all required fields')
        return false
      }
      return true
    }
    return true
  }

  const goToNextStep = () => {
    if (currentStep === 'job-details' && validateStep('job-details')) setCurrentStep('datetime')
    else if (currentStep === 'datetime' && validateStep('datetime')) setCurrentStep('client-details')
    else if (currentStep === 'client-details' && validateStep('client-details')) setCurrentStep('review')
  }

  const goToPreviousStep = () => {
    if (currentStep === 'datetime') setCurrentStep('job-details')
    else if (currentStep === 'client-details') setCurrentStep('datetime')
    else if (currentStep === 'review') setCurrentStep('client-details')
  }

  const goToStep = (step: Step) => setCurrentStep(step)

  const handleCheckout = async () => {
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms of service')
      return
    }
    setIsCheckingOut(true)
    try {
      const fullAddress = `${formData.streetAddress}${formData.city ? ', ' + formData.city : ''}${formData.state ? ', ' + formData.state : ''}${formData.zipCode ? ' ' + formData.zipCode : ''}`
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: formData.email,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerPhone: formData.phone,
          propertyAddress: fullAddress,
          accessMethod: formData.serviceType.includes('toilet') ? 'toilet-pull' : formData.serviceType.includes('roof') ? 'roof-vent' : 'cleanout',
          sewerAccessMethod: formData.cleanoutLocation,
          addOns: formData.addOns,
          message: `Occupancy: ${formData.occupancy}\nAccess: ${formData.propertyAccess}\nCleanout: ${formData.cleanoutLocation}\nReferrer: ${formData.referrerName}\nBuyer's Agent: ${formData.buyersAgent}\nListing Agent: ${formData.listingAgent}\nHow heard: ${formData.howHeardAboutUs}\nDirections: ${formData.directions}`,
          promoCode: activePromoCode,
          appointmentStart: formData.selectedTimeSlot?.start,
          appointmentEnd: formData.selectedTimeSlot?.end,
          appointmentDisplay: formData.selectedTimeSlot?.display,
          appointmentDate: formData.selectedDate,
          serviceType: formData.serviceType,
          // Structured form fields for database storage
          occupancy: formData.occupancy,
          propertyAccess: formData.propertyAccess,
          cleanoutLocation: formData.cleanoutLocation,
          referrerName: formData.referrerName,
          buyersAgent: formData.buyersAgent,
          listingAgent: formData.listingAgent,
          howHeardAboutUs: formData.howHeardAboutUs,
          directions: formData.directions,
          propertyCity: formData.city,
          propertyState: formData.state,
          propertyZip: formData.zipCode,
        }),
      })
      const result = await response.json()
      if (result?.url) {
        markConverted()
        window.location.href = result.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout. Please try again or call us directly.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const formatAppointmentDate = () => {
    if (!formData.selectedDate) return ''
    const date = new Date(formData.selectedDate + 'T12:00:00')
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatAppointmentDateShort = () => {
    if (!formData.selectedDate) return ''
    const date = new Date(formData.selectedDate + 'T12:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  // Calendar generation
  const availableDates = useMemo(() => availability.filter(d => d.hasAvailableSlots).map(d => d.date), [availability])
  const selectedDayData = availability.find(d => d.date === formData.selectedDate)

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startPadding; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [currentMonth])

  const todayDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Step indicator
  const steps = [
    { key: 'job-details' as const, label: 'Job Details', number: 1 },
    { key: 'datetime' as const, label: 'Date & Time', number: 2 },
    { key: 'client-details' as const, label: 'Your Details', number: 3 },
    { key: 'review' as const, label: 'Review & Confirm', number: 4 },
  ]
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-secondary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">We&apos;ve received your request and will get back to you within 24 hours.</p>
        <button onClick={() => setIsSuccess(false)} className="btn-secondary">Submit Another Request</button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key
            const isPast = index < currentIndex
            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${isActive || isPast ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step.number}
                  </div>
                  <span className={`text-xs mt-1 whitespace-nowrap ${isActive ? 'text-primary-600 font-semibold' : isPast ? 'text-primary-600' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${isPast ? 'bg-primary-600' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ==================== STEP 1: Job Details ==================== */}
      {currentStep === 'job-details' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
            <p className="text-gray-600 text-sm">Tell us about the property and how we can access it.</p>
          </div>
          <div className="bg-primary-900 text-white rounded-lg p-4 space-y-3">
            <label htmlFor="serviceType" className="block text-sm font-medium text-primary-200">Select Service Type</label>
            <select
              id="serviceType"
              name="serviceType"
              value={formData.serviceType}
              onChange={handleServiceTypeChange}
              className="w-full bg-white text-gray-900 rounded-lg px-4 py-3 font-semibold focus:ring-2 focus:ring-primary-400"
            >
              {serviceTypes.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label} - {formatCents(opt.amountCents)}</option>
              ))}
            </select>
            <div className="text-sm text-primary-200 space-y-1">
              {serviceTypes.map(option => (
                <p key={option.value}><span className="font-semibold">{option.label} ({formatCents(option.amountCents)}):</span> {option.description}</p>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="occupancy" className="form-label"><span className="text-primary-600">*</span> Property Occupancy Status</label>
            <select id="occupancy" name="occupancy" value={formData.occupancy} onChange={handleChange} className="form-input" required>
              {occupancyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyAccess" className="form-label"><span className="text-primary-600">*</span> Property Access Instructions</label>
              <textarea id="propertyAccess" name="propertyAccess" value={formData.propertyAccess} onChange={handleChange} placeholder="Lockbox code, gate code, showing instructions, alarm info, etc." rows={3} className="form-input resize-none" required />
            </div>
            <div>
              <label htmlFor="cleanoutLocation" className="form-label"><span className="text-primary-600">*</span> Cleanout Location (if known)</label>
              <textarea id="cleanoutLocation" name="cleanoutLocation" value={formData.cleanoutLocation} onChange={handleChange} placeholder="Basement, side yard, front yard, unknown, etc." rows={3} className="form-input resize-none" required />
            </div>
          </div>

          <div>
            <label htmlFor="referrerName" className="form-label">Who referred you? (optional)</label>
            <input id="referrerName" type="text" name="referrerName" value={formData.referrerName} onChange={handleChange} className="form-input" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyersAgent" className="form-label">Buyer&apos;s Agent Contact Info</label>
              <textarea id="buyersAgent" name="buyersAgent" value={formData.buyersAgent} onChange={handleChange} placeholder="Name, phone, or email" rows={2} className="form-input resize-none" />
            </div>
            <div>
              <label htmlFor="listingAgent" className="form-label">Listing Agent Contact Info</label>
              <textarea id="listingAgent" name="listingAgent" value={formData.listingAgent} onChange={handleChange} placeholder="Name, phone, or email" rows={2} className="form-input resize-none" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="howHeardAboutUs" className="form-label">How did you hear about us?</label>
              <select id="howHeardAboutUs" name="howHeardAboutUs" value={formData.howHeardAboutUs} onChange={handleChange} className="form-input">
                {howHeardOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="promoCode" className="form-label">Promo Code</label>
              <input id="promoCode" type="text" name="promoCode" value={formData.promoCode} onChange={handleChange} placeholder="Enter promo code" className="form-input" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
            <p>&#8226; Need a date or time not shown? Call us at <a href={`tel:${COMPANY_INFO.phoneRaw}`} className="text-primary-600 font-semibold hover:underline">{COMPANY_INFO.phone}</a> — we&apos;ll do our best to work with your schedule.</p>
            <p>&#8226; Every inspection includes a detailed written report and HD video recording, delivered to your inbox within one business day.</p>
            <p>&#8226; Payment is collected at checkout before service is confirmed.</p>
            <p>&#8226; Before continuing, verify the selected access method. Standard pricing requires an accessible cleanout; toilet pull/reset includes a new wax ring and supply line; roof vent access is a separate priced access method.</p>
          </div>

          <label className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer">
            <input type="checkbox" name="accessVerified" checked={formData.accessVerified} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" required />
            <span className="text-sm text-amber-900"><span className="font-semibold">Access verification required:</span> {getAccessVerificationCopy()}</span>
          </label>

          <button type="button" onClick={goToNextStep} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg">
            CONTINUE <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 2: Date & Time ==================== */}
      {currentStep === 'datetime' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Date & Time</h2>
              <p className="text-gray-600 text-sm">Please select a desired arrival date. Available dates are highlighted in <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-semibold">blue</span></p>
            </div>
          </div>

          {isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
              <p className="text-gray-600">Loading available times...</p>
            </div>
          ) : calendarError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{calendarError}</p>
              <button onClick={fetchAvailability} className="btn-secondary">Try Again</button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-sm font-semibold text-gray-500 py-2">{day}</div>
                  ))}
                  {calendarDays.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} className="p-2" />
                    const dateStr = date.toISOString().split('T')[0]
                    const available = availableDates.includes(dateStr)
                    const selected = formData.selectedDate === dateStr
                    const isPast = date < todayDate
                    const isTodayDate = todayDate.toISOString().split('T')[0] === dateStr
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => { if (available) handleDateSelect(dateStr) }}
                        disabled={!available || isPast}
                        className={`p-2 rounded-full text-sm transition-all relative ${
                          selected ? 'bg-primary-600 text-white font-bold'
                          : available ? 'bg-sky-100 text-sky-700 hover:bg-sky-200 font-semibold'
                          : isPast ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {date.getDate()}
                        {isTodayDate && <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Available Dates List */}
              <div className="lg:w-64">
                <div className="space-y-2">
                  {availability.filter(d => d.hasAvailableSlots).slice(0, 5).map((day) => {
                    const date = new Date(day.date + 'T12:00:00')
                    const isSelected = formData.selectedDate === day.date
                    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
                    const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => handleDateSelect(day.date)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <span className="font-semibold">{dayOfWeek} {monthDay}</span>
                        <sup className="ml-0.5">{getOrdinalSuffix(date.getDate())}</sup>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Time Slot Selection */}
          {formData.selectedDate && selectedDayData && (
            <div className="border-t pt-6">
              <label className="form-label flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" /> Select a Time for {formatAppointmentDateShort()}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedDayData.slots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      formData.selectedTimeSlot?.start === slot.start ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : slot.available ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      : 'border-gray-100 bg-gray-100 opacity-50 cursor-not-allowed line-through'
                    }`}
                  >
                    <div className={`font-semibold ${
                      formData.selectedTimeSlot?.start === slot.start ? 'text-primary-700' : slot.available ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {slot.display}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={goToNextStep} disabled={!formData.selectedDate || !formData.selectedTimeSlot} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            CONTINUE <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 3: Client Details ==================== */}
      {currentStep === 'client-details' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Client Details</h2>
              <p className="text-gray-600 text-sm">Enter your contact info and the address where the inspection will take place.</p>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="flex items-center gap-2 text-primary-600 font-semibold mb-4">
              <User className="w-5 h-5" /> Contact Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label"><span className="text-primary-600">*</span> First Name</label>
                <input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="given-name" />
              </div>
              <div>
                <label htmlFor="lastName" className="form-label"><span className="text-primary-600">*</span> Last Name</label>
                <input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="family-name" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="phone" className="form-label"><span className="text-primary-600">*</span> Phone</label>
                <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleLeadBlur} placeholder="(317) 000-0000" className="form-input" required autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="email" className="form-label"><span className="text-primary-600">*</span> Email</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="email" />
              </div>
            </div>
          </div>

          {/* Service Address */}
          <div>
            <h3 className="flex items-center gap-2 text-primary-600 font-semibold mb-4">
              <MapPin className="w-5 h-5" /> Service Address
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="streetAddress" className="form-label"><span className="text-primary-600">*</span> Street Address</label>
                <input id="streetAddress" type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="street-address" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label htmlFor="city" className="form-label"><span className="text-primary-600">*</span> City</label>
                  <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleLeadBlur} className="form-input" required autoComplete="address-level2" />
                </div>
                <div>
                  <label htmlFor="state" className="form-label"><span className="text-primary-600">*</span> State</label>
                  <select id="state" name="state" value={formData.state} onChange={handleChange} className="form-input">
                    <option value="Indiana">Indiana</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="zipCode" className="form-label">Zip Code</label>
                    <input id="zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="46227" className="form-input" autoComplete="postal-code" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="directions" className="form-label">Directions</label>
                <textarea id="directions" name="directions" value={formData.directions} onChange={handleChange} placeholder="Any special directions to find the property..." rows={3} className="form-input resize-none" />
              </div>
            </div>
          </div>

          <button type="button" onClick={goToNextStep} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg">
            CONTINUE <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ==================== STEP 4: Review & Confirm ==================== */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={goToPreviousStep} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
              <p className="text-gray-600 text-sm">Please review your request.</p>
              <p className="text-sm">Select the <span className="text-primary-600 font-semibold">Confirm Booking</span> button below to finalize your inspection request.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Order Details */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold">Order Details</h3>
                <button type="button" onClick={() => goToStep('job-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> Edit</button>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Service/access selected:</span> <span className="font-medium">{pricing.service.label}</span></div>
                <div><span className="text-gray-500">Access verification:</span> <span className="font-medium">{formData.accessVerified ? 'Confirmed' : 'Not confirmed'}</span></div>
                <div><span className="text-gray-500">Occupancy status:</span> <span className="font-medium capitalize">{formData.occupancy}</span></div>
                <div><span className="text-gray-500">Access instructions:</span> <span className="font-medium">{formData.propertyAccess || 'N/A'}</span></div>
                <div><span className="text-gray-500">Cleanout location:</span> <span className="font-medium">{formData.cleanoutLocation || 'N/A'}</span></div>
                {formData.referrerName && <div><span className="text-gray-500">Referred by:</span> <span className="font-medium">{formData.referrerName}</span></div>}
                {formData.buyersAgent && <div><span className="text-gray-500">Buyer&apos;s agent:</span> <span className="font-medium">{formData.buyersAgent}</span></div>}
                {formData.listingAgent && <div><span className="text-gray-500">Listing agent:</span> <span className="font-medium">{formData.listingAgent}</span></div>}
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold">Contact Details</h3>
                <button type="button" onClick={() => goToStep('client-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> Edit</button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">{formData.firstName} {formData.lastName}</div>
                <div><span className="text-gray-500">Phone:</span> {formData.phone}</div>
                <div><span className="text-gray-500">Email:</span> {formData.email}</div>
                <div className="pt-2"><span className="text-gray-500">Billing Address:</span><br />{formData.streetAddress}<br />{formData.city}, {formData.state} {formData.zipCode}</div>
              </div>
            </div>

            {/* Service Date */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold">Service Date</h3>
                <button type="button" onClick={() => goToStep('datetime')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> Edit</button>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{formatAppointmentDate()}</div>
                <div className="text-gray-600">{formData.selectedTimeSlot?.display}</div>
              </div>
            </div>

            {/* Service Address */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-primary-600 font-semibold">Service Address</h3>
                <button type="button" onClick={() => goToStep('client-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> Edit</button>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{formData.streetAddress}</div>
                <div>{formData.city}, {formData.state} {formData.zipCode}</div>
                <div className="pt-2">
                  <span className="text-gray-500">On-site Contact:</span> {formData.firstName} {formData.lastName}<br />
                  <span className="text-gray-500">Phone:</span> {formData.phone}<br />
                  <span className="text-gray-500">Email:</span> {formData.email}
                </div>
              </div>
            </div>
          </div>

          {/* Items / Pricing */}
          <div className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-center text-sm border-b pb-2 mb-2">
              <span>{pricing.service.label}</span>
              <span>1 X {formatCents(pricing.service.amountCents)}</span>
            </div>
            {/* Add-ons Selection */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Needed items / add-ons:</p>
                <button type="button" onClick={() => goToStep('job-details')} className="text-primary-600 text-sm flex items-center gap-1 hover:underline"><Edit2 className="w-3 h-3" /> Edit service</button>
              </div>
              <div className="space-y-2">
                {ADD_ON_OPTIONS.map(addOn => (
                  <label key={addOn.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.addOns.includes(addOn.id)}
                      onChange={(e) => toggleAddOn(addOn.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5"
                    />
                    <span className="text-sm">
                      {addOn.label} ({formatCents(addOn.amountCents)}) <span className="text-gray-500">{addOn.description}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Verify these before checkout. If needed items are discovered on-site after checkout, they may need to be charged separately.</p>
            </div>
            <div className="space-y-1 text-sm mt-3">
              {pricing.addOnItems.map(addOn => (
                <div key={addOn.id} className="flex justify-between text-gray-700">
                  <span>{addOn.label}</span>
                  <span>{formatCents(addOn.amountCents)}</span>
                </div>
              ))}
              <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">{formatCents(pricing.subtotalCents)}</span></div>
              {pricing.promoApplied && (
                <div className="flex justify-between text-green-600"><span>Promo ({activePromoCode.trim().toUpperCase()}):</span><span>-{formatCents(pricing.discountCents)}</span></div>
              )}
              <div className="flex justify-between"><span>Tax:</span><span>$0.00</span></div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span>{formatCents(pricing.totalCents)}</span></div>
            </div>
            {formData.referrerName && (
              <div className="mt-4 pt-3 border-t text-sm text-gray-600">Thanks for choosing Precision Sewer Inspection!</div>
            )}
          </div>

          {/* Terms and Newsletter */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-0.5" required />
              <span className="text-sm">
                <span className="text-primary-600">*</span> I agree with the terms of service
                <button type="button" onClick={() => setShowTerms(!showTerms)} className="text-primary-600 ml-2 hover:underline">{showTerms ? 'Hide' : 'Show'} Terms of Service</button>
              </span>
            </label>
            {showTerms && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 ml-8">
                <p>&#8226; <strong>Trip Fee:</strong> A $79 trip fee applies if access is unavailable at the scheduled time.</p>
                <p>&#8226; <strong>Access Method:</strong> If the access method differs from what was selected, additional charges may apply.</p>
                <p>&#8226; <strong>Cleanout Access:</strong> If there is no available cleanout, you are approving Precision Sewer Inspection to access the sewer line via toilet removal/reinstallation or roof vent pipe access.</p>
                <p>&#8226; <strong>Payment:</strong> Payment is collected at checkout before service is confirmed.</p>
                <p>&#8226; <strong>Report Delivery:</strong> Written report and video will be emailed within one business day of inspection.</p>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="subscribeNewsletter" checked={formData.subscribeNewsletter} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm">Please email me occasional promotions and newsletters.</span>
            </label>
          </div>

          <button type="button" onClick={handleCheckout} disabled={!formData.agreeToTerms || isCheckingOut} className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isCheckingOut ? (<><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>) : 'CONFIRM BOOKING'}
          </button>
        </div>
      )}
    </form>
  )
}
