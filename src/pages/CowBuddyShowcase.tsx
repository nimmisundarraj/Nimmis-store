import React from 'react';
import { Character, cowBuddy, useBuddy, type BuddyAction } from '../characters';

const BUTTONS: { action: BuddyAction; label: string }[] = [
  { action: 'happy', label: 'Happy' },
  { action: 'excited', label: 'Excited' },
  { action: 'worried', label: 'Worried' },
  { action: 'sleepy', label: 'Sleepy' },
  { action: 'love', label: 'Love' },
  { action: 'laugh', label: 'Laugh' },
  { action: 'jump', label: 'Jump' },
  { action: 'walk', label: 'Walk' },
];

const CowBuddyShowcase: React.FC = () => {
  const { action } = useBuddy();

  return (
    <main className="min-h-screen bg-[#fff5d6] px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Character name="cow-stand" alt="The Nimmi's cow" className="mx-auto h-56 w-auto" />
        <h1 className="mt-6 text-4xl font-bold text-[#2a1a05]">Meet the Nimmi's cow</h1>
        <p className="mt-2 text-[#6a4c17]">
          She lives in the bottom corner of every page. Tap her, or use the buttons below.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUTTONS.map(({ action: a, label }) => (
            <button
              key={a}
              type="button"
              onClick={() => cowBuddy(a)}
              className={`rounded-full px-4 py-3 font-semibold transition-colors ${
                action === a ? 'bg-[#c8261b] text-white' : 'bg-white text-[#2a1a05] hover:bg-[#ffe9a6]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <pre className="mt-10 overflow-x-auto rounded-xl bg-white p-4 text-left text-sm text-[#2a1a05]">
{`import { cowBuddy } from './characters';

<button onClick={() => cowBuddy('love')}>Add to cart</button>
<button onClick={() => cowBuddy('happy', 'Order sent!')}>Order</button>`}
        </pre>
      </div>
    </main>
  );
};

export default CowBuddyShowcase;
