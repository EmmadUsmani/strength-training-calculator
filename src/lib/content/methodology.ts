/**
 * The written explainer. Kept as data rather than markup so the methodology
 * page stays a thin renderer and the rules stay reviewable in one place.
 */

export interface MethodologyRule {
	term: string;
	detail: string;
}

export interface MethodologySection {
	id: string;
	heading: string;
	/** Lead paragraphs. */
	body: string[];
	/** Optional definition-list style rules. */
	rules?: MethodologyRule[];
}

export const METHODOLOGY_INTRO =
	'This plan replaces a Greyskull-style linear progression that had stalled on the upper-body presses. The diagnosis was not that the weights were too heavy — it was that effort was spread across two or three near-maximal top sets plus several deep drop sets, which produced a lot of fatigue and very little strength signal. Everything below follows from concentrating the hard effort into one clean top set and putting the rest of the work at a load you can actually recover from.';

export const METHODOLOGY: MethodologySection[] = [
	{
		id: 'shape',
		heading: 'The shape of a session',
		body: [
			'Every lift runs the same skeleton: a short warm-up ramp, exactly one top set, then back-off volume, then an optional finisher. The top set is the only set that tests your strength; everything after it exists to build the muscle that raises the top set later.'
		],
		rules: [
			{
				term: 'Warm-up',
				detail:
					'Three sets for the presses and rows (empty bar, roughly 58%, roughly 82%), four for squat and deadlift where the gap from an empty bar to the top set is much wider. The last warm-up lands 10-20 lb under the top set: heavy enough to prime the nervous system, light enough to cost nothing.'
			},
			{
				term: 'Top set',
				detail:
					'One set. Not two, not three. A second set at the same weight is a fatigued set in disguise — it feels like work but teaches your body nothing it did not already learn from the first one.'
			},
			{
				term: 'Back-offs',
				detail:
					'80-85% of the top set the block was anchored to, for 6-8 reps. This is where the volume that drives hypertrophy and work capacity lives. Three sets for bench and OHP, two for row, one for squat, one (optional) for deadlift.'
			},
			{
				term: 'Finisher',
				detail:
					'One optional drop set at roughly 55% for max reps. Below about 60% of the top set there is little mechanical tension left, so this is genuinely extra credit — the first thing to cut on a bad day, and never a reason to shorten the top set.'
			}
		]
	},
	{
		id: 'progression',
		heading: 'How the weight moves',
		body: [
			'Load progression is gated on rep quality, not on the calendar. The gate is deliberately strict, because adding weight onto a grind is exactly how the previous plateau formed.'
		],
		rules: [
			{ term: 'Clean top set', detail: 'All target reps with good bar speed and form. Add 2.5 lb next session.' },
			{
				term: 'Hit the reps, but ground them out',
				detail: 'Repeat the same weight next session. Confirm you can own it before you add to it.'
			},
			{ term: 'Missed the rep target', detail: 'Repeat the same weight. No added load until the top set is clean.' },
			{
				term: 'Missed twice in a row',
				detail:
					'Drop 10%, rounded to a loadable weight, and rebuild. A deload clears the counter, so you get a fresh two-miss allowance on the way back up.'
			},
			{
				term: 'After a deload or a long layoff',
				detail: 'Use the longer warm-up ramp for a session or two, then go back to the short one.'
			}
		]
	},
	{
		id: 'backoffs',
		heading: 'Why 80-85%',
		body: [
			'At 90%+ of the top set you can manage two to four reps before form breaks down, which recreates the original problem: multiple sets at near-maximal load, high fatigue cost, little volume. At 80-85% you get 6-8 reps with good bar speed and much less joint stress, which is what actually builds the base underneath the top set.',
			'The two halves of the session are deliberately kept from fighting each other for the same recovery. The top set is the strength driver and moves nearly every session; the back-offs are the volume driver and stay put for weeks at a time.'
		]
	},
	{
		id: 'blocks',
		heading: 'The back-off block',
		body: [
			'Back-off weights are held fixed for a stretch of sessions — a block — and only then recalculated. Moving them every session turns them into a second thing to test, which is what caused the original stall. Inside a block the reps climb instead of the weight: hit the bottom of the range, then chase one more rep each session up to the top of it.',
			'The real trigger for resetting a block is meaningful progress on the top set, not an arbitrary session count. The time-based rule is only a fallback for when strength gains slow down.'
		],
		rules: [
			{
				term: 'Movement trigger',
				detail:
					'The block resets once the top set has climbed 7.5 lb past the weight the block was set from. The research gives a 5-10 lb window; this takes the middle of it, which is three clean sessions at 2.5 lb — or the four to six the research expects once the usual misses and repeats are in the mix.'
			},
			{
				term: 'Time trigger',
				detail:
					'Whichever comes first: the block also resets after three weeks on the same weight, converted to a session count from how often you train the lift. At 2×/week that is six sessions; at 1×/week, three.'
			},
			{
				term: 'Deload',
				detail:
					'A 10% cut to the top set resets the block with it, rather than leaving back-offs sitting on top of a lighter top set.'
			},
			{
				term: 'Reps inside a block',
				detail:
					'Add a rep per session up to the top of the range before anything else changes. If three sets at the top of the range start feeling easy well before the block resets, adding a fourth set is a reasonable upgrade on the lifts that tolerate volume — bench, OHP and squat, not deadlift.'
			},
			{
				term: 'Overriding it',
				detail:
					'The automatic decision is a default, not a rule. Hold or reset the block by hand whenever you have a reason to — resetting after three sessions because the back-offs feel light is a perfectly good reason.'
			}
		]
	},
	{
		id: 'rest',
		heading: 'Rest',
		body: [],
		rules: [
			{ term: 'Between warm-up sets', detail: '30-60 seconds — just long enough to change plates. They are meant to cost nothing.' },
			{
				term: 'Before the top set',
				detail: '3-4 minutes. This is the one set that has to reflect real strength rather than leftover fatigue, so do not rush it.'
			},
			{ term: 'Between back-off sets', detail: '2-3 minutes at a submaximal load.' },
			{ term: 'Into the drop set', detail: 'Straight in, no rest. Hitting fatigue is the entire point of that set.' }
		]
	},
	{
		id: 'per-lift',
		heading: 'Where the lifts differ',
		body: [],
		rules: [
			{
				term: 'Bench and OHP',
				detail:
					'The lifts this plan was designed around. Three back-off sets, since the presses tolerate volume well and needed the most added work.'
			},
			{
				term: 'Squat and deadlift',
				detail:
					'Switched to one top set pre-emptively, before a stall, because they recruit far more muscle and cost more recovery per grinding set than the presses do. Squat gets one back-off at 85%; deadlift gets one at 80% and it is marked optional — deadlift has the worst fatigue-to-benefit ratio per extra set in the program.'
			},
			{
				term: 'Barbell row',
				detail:
					'The research never prescribed a row structure, since row was still progressing linearly. This calculator mirrors the press template with one fewer back-off set. Treat it as an extrapolation rather than a rule.'
			},
			{
				term: 'Barbell curl',
				detail:
					'Runs a different model entirely. Biceps are a small single-joint muscle that responds better to moderate loads in the 8-12 range than to low-rep grinding, so reps climb first: hit 8 clean, then chase 9, 10, 11, 12. Only at 12 does the weight go up 2.5 lb and the ladder reset to 8. It finishes with one dumbbell curl set to failure, taken after a normal 60-90 second rest rather than as a drop set.'
			}
		]
	},
	{
		id: 'state',
		heading: 'What the calculator remembers',
		body: [
			'Nothing. Every number on the page is computed from what is currently in the form, so the same inputs always produce the same prescription and there is no hidden history to get out of step with your logbook. That is why it asks for the back-off weight and how many sessions you have used it — those are the two facts it would otherwise have to remember for you.'
		]
	},
	{
		id: 'outside',
		heading: 'What the calculator does not cover',
		body: [
			'A few things from the research matter as much as the set and rep scheme but are not something a calculator can prescribe: a 200-300 calorie surplus with 1.6-2.2 g/kg of protein, 7-9 hours of sleep, face pulls and band pull-aparts as shoulder insurance under increasing press volume, and dumbbell pressing as accessory work to correct side-to-side imbalance. Sticking-point diagnosis is worth doing by hand too: failing near the chest points at the pecs, failing at lockout points at the triceps.'
		]
	}
];
