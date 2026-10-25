import assert from 'node:assert/strict';
import { cn } from '../lib/utils';

// Component overrides must replace conflicting utilities without dropping
// independent dimensions, variants, semantic classes, or color/font settings.
assert.equal(cn('px-4 py-2', 'px-6'), 'py-2 px-6');
assert.equal(cn('p-4', 'px-6'), 'p-4 px-6');
assert.equal(cn('px-6', 'p-4'), 'p-4');
assert.equal(cn('text-sm text-primary-700', 'text-lg text-accent-500'), 'text-lg text-accent-500');
assert.equal(cn('bg-primary-500 hover:bg-primary-700', 'bg-accent-500'), 'hover:bg-primary-700 bg-accent-500');
assert.equal(cn('btn-primary form-input', false, null, { 'w-full': true }), 'btn-primary form-input w-full');
assert.equal(cn('focus:ring-2 focus:ring-primary-500', 'focus:ring-4'), 'focus:ring-primary-500 focus:ring-4');

// Tailwind 4's renamed classes must participate in the same override behavior.
assert.equal(cn('shadow-xs hover:shadow-lg', 'shadow-md'), 'hover:shadow-lg shadow-md');
assert.equal(cn('rounded-xs', 'rounded-sm'), 'rounded-sm');
assert.equal(cn('bg-linear-to-r/srgb', 'bg-linear-to-br/srgb'), 'bg-linear-to-br/srgb');
assert.equal(cn('focus:outline-hidden', 'focus:outline-none'), 'focus:outline-none');
console.log('PASS: component class overrides preserve independent styles and handle Tailwind 4 utilities.');
