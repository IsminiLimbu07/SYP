import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM CHECKER DATA
// ─────────────────────────────────────────────────────────────────────────────
const SYMPTOMS = [
  { id: 'unconscious',    label: 'Unconscious / Unresponsive',    icon: 'account-off' },
  { id: 'not_breathing',  label: 'Not Breathing',                 icon: 'weather-windy' },
  { id: 'chest_pain',     label: 'Chest Pain / Pressure',         icon: 'heart-outline' },
  { id: 'choking',        label: 'Choking / Airway Blocked',      icon: 'alert-circle-outline' },
  { id: 'heavy_bleeding', label: 'Heavy Bleeding',                icon: 'water-outline' },
  { id: 'face_droop',     label: 'Face Drooping / Slurred Speech',icon: 'emoticon-confused-outline' },
  { id: 'arm_weakness',   label: 'Sudden Arm / Leg Weakness',     icon: 'human-handsdown' },
  { id: 'seizure',        label: 'Seizure / Convulsions',         icon: 'pulse' },
  { id: 'burn',           label: 'Burn / Scald',                  icon: 'fire' },
  { id: 'fracture',       label: 'Possible Broken Bone',          icon: 'alert-decagram-outline' },
  { id: 'allergic',       label: 'Allergic Reaction / Swelling',  icon: 'flower-outline' },
  { id: 'poisoning',      label: 'Poisoning / Overdose',          icon: 'flask-outline' },
  { id: 'drowning',       label: 'Near-Drowning',                 icon: 'swim' },
  { id: 'heatstroke',     label: 'Overheating / Heat Stroke',     icon: 'thermometer' },
  { id: 'hypothermia',    label: 'Shivering / Extreme Cold',      icon: 'snowflake' },
  { id: 'snakebite',      label: 'Snakebite / Animal Bite',       icon: 'exclamation-thick' },
  { id: 'eye_injury',     label: 'Eye Injury / Chemical Splash',  icon: 'eye-outline' },
  { id: 'diabetic',       label: 'Diabetic Emergency / Confusion',icon: 'needle' },
  { id: 'nausea_vomit',   label: 'Nausea / Vomiting',             icon: 'emoticon-sad-outline' },
  { id: 'head_injury',    label: 'Head Injury',                   icon: 'account-alert-outline' },
  { id: 'child_involved', label: 'Child / Infant Involved',       icon: 'human-child' },
  { id: 'electric_shock', label: 'Electric Shock',                icon: 'lightning-bolt' },
  { id: 'spinal',         label: 'Suspected Spine / Neck Injury', icon: 'human-handsup' },
];

// ─────────────────────────────────────────────────────────────────────────────
// GUIDES DATA  (35 conditions)
// ─────────────────────────────────────────────────────────────────────────────
const firstAidGuides = [
  // ── CRITICAL ──────────────────────────────────────────────────────────────
  {
    id: 1, title: 'CPR (Adult)', category: 'Critical', icon: 'heart-pulse', urgency: 'critical',
    description: 'Life-saving technique for cardiac arrest in adults',
    symptomTags: ['unconscious', 'not_breathing'],
    steps: [
      { step: 1, title: 'Check Responsiveness', instruction: 'Tap shoulders firmly and shout "Are you okay?" Look for chest rise. No response and no normal breathing = start CPR.', timerSeconds: null },
      { step: 2, title: 'Call 102 Now', instruction: 'Shout for help. Call 102 or direct someone: "You — call 102 right now." Put on speaker.', timerSeconds: null },
      { step: 3, title: 'Position on Back', instruction: 'Lay person flat on their back on a firm surface. Kneel beside their chest.', timerSeconds: null },
      { step: 4, title: 'Hand Placement', instruction: 'Heel of one hand on the CENTER of the chest (lower half of breastbone). Other hand on top, fingers interlaced and raised.', timerSeconds: null },
      { step: 5, title: 'Compressions — Push Hard & Fast', instruction: 'Arms straight. Compress at least 2 inches (5 cm) deep. Rate: 100–120/min (rhythm of "Stayin\' Alive"). Allow full chest recoil between compressions. Count aloud: 1, 2, 3...', timerSeconds: 120 },
      { step: 6, title: 'Rescue Breaths (if trained)', instruction: 'After 30 compressions: tilt head back, lift chin, pinch nose shut, seal mouth, give 2 breaths of 1 second each. Watch for chest rise. If untrained — skip and continue compressions only.', timerSeconds: null },
      { step: 7, title: 'Continue Until Help Arrives', instruction: 'Maintain 30:2 cycle (compressions:breaths). Switch with another rescuer every 2 minutes if possible. Do NOT stop unless person shows clear signs of life.', timerSeconds: null },
    ],
    warnings: ['Hands-only CPR (no breaths) is still effective — do not stop to search for training', 'Do not stop to check pulse repeatedly — minimize interruptions'],
  },
  {
    id: 2, title: 'CPR (Infant / Child)', category: 'Critical', icon: 'human-child', urgency: 'critical',
    description: 'CPR technique adapted for infants and young children',
    symptomTags: ['unconscious', 'not_breathing', 'child_involved'],
    steps: [
      { step: 1, title: 'Check Responsiveness', instruction: 'Flick the sole of the infant\'s foot or tap the child\'s shoulder. Shout their name.', timerSeconds: null },
      { step: 2, title: 'Call 102', instruction: 'Call or shout for help. For infants: give 2 minutes of CPR FIRST, THEN call 102 if alone.', timerSeconds: null },
      { step: 3, title: 'Tilt Head Gently', instruction: 'Tilt head back to a neutral/sniffing position (infants) or slightly more for children. Lift chin. Look-listen-feel for breathing (up to 10 sec).', timerSeconds: null },
      { step: 4, title: 'Give 2 Rescue Breaths', instruction: 'For infants: cover mouth AND nose with your mouth. For children: pinch nose, cover mouth. Give 2 gentle puffs — just enough to see chest rise.', timerSeconds: null },
      { step: 5, title: 'Chest Compressions', instruction: 'Infant: 2 fingers on center of chest, compress 1.5 inches (4 cm). Child: 1–2 hands, compress 2 inches (5 cm). Rate: 100–120/min. Do 30 compressions.', timerSeconds: 60 },
      { step: 6, title: 'Cycle: 30:2', instruction: 'Alternate 30 compressions and 2 breaths. Continue until help arrives or child recovers.', timerSeconds: null },
    ],
    warnings: ['Never shake an infant', 'Infant breaths should be very gentle — small puffs only, not full breaths', 'Head tilt for infants is minimal — only to neutral position'],
  },
  {
    id: 3, title: 'Choking (Adult)', category: 'Critical', icon: 'alert-circle', urgency: 'critical',
    description: 'Emergency procedure for blocked airway in adults',
    symptomTags: ['choking'],
    steps: [
      { step: 1, title: 'Identify Severe Choking', instruction: 'Person cannot breathe, cough forcefully, or speak. May clutch throat with both hands (universal sign). Lips may turn blue.', timerSeconds: null },
      { step: 2, title: 'Encourage Coughing First', instruction: 'If person can still cough or breathe, encourage them to keep coughing. Only intervene if they cannot.', timerSeconds: null },
      { step: 3, title: '5 Back Blows', instruction: 'Stand to the side and slightly behind. Support their chest with one hand. Lean them forward. Give 5 firm blows with heel of hand between shoulder blades.', timerSeconds: null },
      { step: 4, title: '5 Abdominal Thrusts (Heimlich)', instruction: 'Stand behind. Arms around waist. Make fist with one hand — thumb side against abdomen, just above navel and below breastbone. Grasp fist with other hand. Give 5 quick, firm, inward-and-upward thrusts.', timerSeconds: null },
      { step: 5, title: 'Repeat Cycle', instruction: 'Alternate 5 back blows and 5 abdominal thrusts until object is expelled or person loses consciousness.', timerSeconds: null },
      { step: 6, title: 'If Unconscious — Start CPR', instruction: 'Lower carefully to floor. Call 102. Start CPR. Each time you open the airway for breaths, look in the mouth — only remove visible object.', timerSeconds: null },
    ],
    warnings: ['For pregnant or obese: chest thrusts instead of abdominal thrusts', 'Never perform blind finger sweeps — only remove objects you can clearly see'],
  },
  {
    id: 4, title: 'Choking (Infant)', category: 'Critical', icon: 'human-child', urgency: 'critical',
    description: 'Airway obstruction technique for infants under 1 year',
    symptomTags: ['choking', 'child_involved'],
    steps: [
      { step: 1, title: 'Position Face-Down', instruction: 'Hold infant face-down along your forearm, supporting the head. Head must be lower than the chest.', timerSeconds: null },
      { step: 2, title: '5 Back Blows', instruction: 'Using the heel of your other hand, give 5 firm back blows between the shoulder blades.', timerSeconds: null },
      { step: 3, title: 'Flip Face-Up', instruction: 'Carefully turn infant face-up, supporting the head. Keep head lower than body.', timerSeconds: null },
      { step: 4, title: '5 Chest Thrusts', instruction: 'Place 2 fingers on center of chest just below nipple line. Give 5 quick downward thrusts — about 1.5 inches deep. DO NOT give abdominal thrusts.', timerSeconds: null },
      { step: 5, title: 'Check Mouth', instruction: 'Look in the mouth. Remove object ONLY if you can clearly see it.', timerSeconds: null },
      { step: 6, title: 'Repeat / CPR if Needed', instruction: 'If still choking, repeat cycle. If unconscious and not breathing, start infant CPR and call 102.', timerSeconds: null },
    ],
    warnings: ['NEVER give abdominal thrusts to infants under 1 year', 'Never shake an infant', 'Never do blind finger sweeps'],
  },
  {
    id: 5, title: 'Severe Bleeding', category: 'Critical', icon: 'water-outline', urgency: 'critical',
    description: 'Control life-threatening hemorrhage',
    symptomTags: ['heavy_bleeding'],
    steps: [
      { step: 1, title: 'Protect Yourself', instruction: 'Put on gloves or use plastic bags. Avoid direct contact with blood.', timerSeconds: null },
      { step: 2, title: 'Apply Direct Pressure', instruction: 'Press clean cloth or gauze DIRECTLY on wound. Use both hands, press hard.', timerSeconds: null },
      { step: 3, title: 'Hold Pressure — 10 Minutes', instruction: 'Do NOT lift or peek. Maintain firm, uninterrupted pressure. If soaks through, add more layers on top — do not remove first layer.', timerSeconds: 600 },
      { step: 4, title: 'Elevate the Limb', instruction: 'If no broken bones suspected, raise the injured area above heart level.', timerSeconds: null },
      { step: 5, title: 'Secure with Bandage', instruction: 'When bleeding slows, bandage firmly (not cutting off circulation). Check fingers/toes for numbness.', timerSeconds: null },
      { step: 6, title: 'Call 102 / Transport', instruction: 'Severe bleeding needs emergency care. Keep person lying down, warm, and calm. Watch for shock signs.', timerSeconds: null },
    ],
    warnings: ['Do NOT remove embedded objects — stabilize them in place', 'Tourniquet is last resort — only trained personnel should apply', 'Watch for shock: pale, cold, clammy skin + fast weak pulse'],
  },
  {
    id: 6, title: 'Heart Attack', category: 'Critical', icon: 'heart', urgency: 'critical',
    description: 'Recognize and act on heart attack symptoms',
    symptomTags: ['chest_pain', 'nausea_vomit'],
    steps: [
      { step: 1, title: 'Recognize Symptoms', instruction: 'Chest pain/pressure/tightness that may spread to arm, jaw, neck, back. Shortness of breath. Cold sweats. Nausea. Dizziness. Sense of doom. Women often have: jaw pain, back pain, extreme fatigue, nausea — without chest pain.', timerSeconds: null },
      { step: 2, title: 'Call 102 Immediately', instruction: 'Call NOW. Do not drive. Every minute of delay = more heart muscle damage.', timerSeconds: null },
      { step: 3, title: 'Sit or Lie Comfortably', instruction: 'Help person into a position they find comfortable — usually sitting up, leaning against wall with knees bent.', timerSeconds: null },
      { step: 4, title: 'Loosen Clothing', instruction: 'Undo buttons, loosen tie, remove tight clothing around neck and chest.', timerSeconds: null },
      { step: 5, title: 'Aspirin if Available', instruction: 'If conscious, not allergic, and no known contraindications: give 300mg aspirin to CHEW slowly (not swallow whole). This slows clot formation.', timerSeconds: null },
      { step: 6, title: 'Monitor & Be Ready for CPR', instruction: 'Stay with person. Talk calmly. Monitor breathing. If they become unresponsive and stop breathing normally, begin CPR immediately.', timerSeconds: null },
    ],
    warnings: ['NEVER leave the person alone', 'Do NOT give aspirin if person has aspirin allergy, is under 16, or has active bleeding', 'Symptoms can be mild — don\'t dismiss them'],
  },
  {
    id: 7, title: 'Stroke', category: 'Critical', icon: 'head-dots-horizontal-outline', urgency: 'critical',
    description: 'Act FAST — brain cells die every minute',
    symptomTags: ['face_droop', 'arm_weakness', 'unconscious'],
    steps: [
      { step: 1, title: 'F — Face Drooping', instruction: 'Ask person to smile. Is one side of the face drooping or numb? Uneven smile is a warning sign.', timerSeconds: null },
      { step: 2, title: 'A — Arm Weakness', instruction: 'Ask person to raise both arms palms up. Does one drift downward? Can they hold both up?', timerSeconds: null },
      { step: 3, title: 'S — Speech Difficulty', instruction: 'Ask them to repeat: "The sky is blue." Is speech slurred, garbled, or can they not speak? Can they understand you?', timerSeconds: null },
      { step: 4, title: 'T — Time to Call 102', instruction: 'If ANY one sign is present: CALL 102 IMMEDIATELY. Note the EXACT TIME symptoms started — this determines treatment options.', timerSeconds: null },
      { step: 5, title: 'Position & Comfort', instruction: 'Have person rest lying on their side (recovery position) or sitting supported. Keep them calm. Do NOT give food or drink.', timerSeconds: null },
      { step: 6, title: 'Monitor Until Help Arrives', instruction: 'Do NOT give aspirin (unlike heart attack). Watch breathing. If they become unconscious, start CPR if needed.', timerSeconds: null },
    ],
    warnings: ['Do NOT give aspirin for stroke', 'Do NOT give food or drink — swallowing may be impaired', 'Time is brain — 1.9 million brain cells die per minute during a stroke'],
  },
  {
    id: 8, title: 'Anaphylaxis (Severe Allergy)', category: 'Critical', icon: 'flower-outline', urgency: 'critical',
    description: 'Life-threatening allergic reaction — act within minutes',
    symptomTags: ['allergic', 'not_breathing'],
    steps: [
      { step: 1, title: 'Recognize Anaphylaxis', instruction: 'Rapid onset after exposure: hives/rash, swelling (face, throat, tongue), difficulty breathing, wheezing, drop in blood pressure, dizziness, loss of consciousness.', timerSeconds: null },
      { step: 2, title: 'Use Epinephrine Auto-Injector (EpiPen)', instruction: 'If person has one: remove blue safety cap. Press orange tip FIRMLY into outer thigh (can go through clothing). Hold for 10 seconds. Remove and rub site for 10 seconds.', timerSeconds: 10 },
      { step: 3, title: 'Call 102 Immediately', instruction: 'Call even if EpiPen was used. Epinephrine is temporary (15–20 min). Hospital treatment is always required.', timerSeconds: null },
      { step: 4, title: 'Position the Person', instruction: 'Breathing difficulty: sit upright. Unconscious / shock: lay flat, legs elevated. Vomiting: recovery position on side.', timerSeconds: null },
      { step: 5, title: 'Second EpiPen if Needed', instruction: 'If no improvement after 5–15 minutes and second EpiPen is available, give second dose in opposite thigh.', timerSeconds: null },
      { step: 6, title: 'Monitor for Biphasic Reaction', instruction: 'Symptoms can return hours later. Even if person seems recovered, they MUST go to hospital.', timerSeconds: null },
    ],
    warnings: ['EpiPen in outer thigh ONLY — never in buttocks, vein, or hands', 'Person must go to hospital even after EpiPen improves symptoms', 'If no EpiPen: call 102 immediately, keep airway open, be ready for CPR'],
  },
  {
    id: 9, title: 'Electric Shock', category: 'Critical', icon: 'lightning-bolt', urgency: 'critical',
    description: 'High-voltage injury — source must be made safe first',
    symptomTags: ['electric_shock', 'unconscious'],
    steps: [
      { step: 1, title: 'DO NOT TOUCH the Person Yet', instruction: 'If they are still in contact with an electrical source, touching them will electrocute you too. Disconnect power first.', timerSeconds: null },
      { step: 2, title: 'Make the Scene Safe', instruction: 'Switch off power at the mains/fuse box if possible. If not: use a dry, non-conductive object (wooden broom handle, plastic chair) to move the source AWAY. Do not use metal or wet objects.', timerSeconds: null },
      { step: 3, title: 'Call 102', instruction: 'Call emergency services. All electric shock victims need medical evaluation even if they seem fine.', timerSeconds: null },
      { step: 4, title: 'Assess the Person', instruction: 'Only approach once safe. Check breathing and responsiveness. Electric shock can cause cardiac arrest.', timerSeconds: null },
      { step: 5, title: 'CPR if Not Breathing', instruction: 'If no pulse or not breathing, begin CPR immediately. Continue until help arrives.', timerSeconds: null },
      { step: 6, title: 'Treat Burns', instruction: 'Electric shocks cause entry and exit burns (often look small but are deep). Cover with clean cloth. Do not apply water or ointment.', timerSeconds: null },
    ],
    warnings: ['NEVER approach until power source is confirmed off', 'Internal damage from electric shock is far greater than visible burns suggest', 'Electricity can cause delayed heart arrhythmia — always seek medical help'],
  },
  {
    id: 10, title: 'Poisoning / Overdose', category: 'Critical', icon: 'flask-outline', urgency: 'critical',
    description: 'Chemical, drug, or substance poisoning emergency',
    symptomTags: ['poisoning', 'unconscious'],
    steps: [
      { step: 1, title: 'Ensure Scene Safety', instruction: 'Do not put yourself at risk from fumes or contamination. Open windows if chemical fumes present.', timerSeconds: null },
      { step: 2, title: 'Identify the Substance', instruction: 'Look for containers, medication bottles, or ask what was taken. Note substance name, amount, and time if possible.', timerSeconds: null },
      { step: 3, title: 'Call 102 or Poison Control', instruction: 'Call emergency services. In India: AIIMS Poison Control: 1800-116-117. Do not wait for symptoms to worsen.', timerSeconds: null },
      { step: 4, title: 'Do NOT Induce Vomiting', instruction: 'Unless specifically told to by emergency services. Vomiting can cause more damage with corrosive substances.', timerSeconds: null },
      { step: 5, title: 'If Unconscious', instruction: 'Place in recovery position (on their side). This prevents choking on vomit. Monitor breathing.', timerSeconds: null },
      { step: 6, title: 'Preserve Evidence', instruction: 'Keep the container, pills, or substance. This helps doctors identify the correct antidote or treatment.', timerSeconds: null },
    ],
    warnings: ['Never give milk, water, or food unless instructed by poison control', 'Never induce vomiting for corrosive substances (bleach, acids, drain cleaner)', 'For skin/eye contact with chemicals: flush with large amounts of water for 20 min'],
  },

  // ── COMMON EMERGENCIES ───────────────────────────────────────────────────
  {
    id: 11, title: 'Burns (Thermal)', category: 'Common', icon: 'fire', urgency: 'urgent',
    description: 'Heat burns from fire, hot water, steam, or contact',
    symptomTags: ['burn'],
    steps: [
      { step: 1, title: 'Stop the Burning', instruction: 'Remove person from heat source. Extinguish flames: stop, drop, roll. Remove clothing/jewelry NEAR the burn — not stuck-on clothing.', timerSeconds: null },
      { step: 2, title: 'Cool with Running Water', instruction: 'Run COOL (not cold, not ice) water over burn for 20 full minutes. This stops the burning process in tissue.', timerSeconds: 1200 },
      { step: 3, title: 'Do Not Apply Anything', instruction: 'Do not use: ice, butter, oil, toothpaste, flour, or any home remedy. These trap heat and cause infection.', timerSeconds: null },
      { step: 4, title: 'Cover Loosely', instruction: 'Cover with a clean, non-fluffy material (cling wrap is ideal, or a clean plastic bag for limbs). Do not wrap tightly.', timerSeconds: null },
      { step: 5, title: 'Pain Relief', instruction: 'Paracetamol or ibuprofen for pain if available and no contraindications.', timerSeconds: null },
      { step: 6, title: 'When to Call 102', instruction: 'Seek emergency help if: burn larger than palm of hand, face/hands/genitals/feet involved, deep/white/charred burn, caused by chemicals or electricity, or child/elderly person.', timerSeconds: null },
    ],
    warnings: ['Do NOT break blisters — this increases infection risk', 'Do NOT use ice — it causes frostbite on top of burn', 'Chemical burns: brush off dry chemical first, then flush with water 20 min'],
  },
  {
    id: 12, title: 'Fractures & Broken Bones', category: 'Common', icon: 'human-handsdown', urgency: 'urgent',
    description: 'Immobilize and stabilize broken bones',
    symptomTags: ['fracture'],
    steps: [
      { step: 1, title: 'Keep Still', instruction: 'Tell person not to move. Do not attempt to straighten or realign the bone.', timerSeconds: null },
      { step: 2, title: 'Control Any Bleeding', instruction: 'If wound is present, apply gentle pressure with clean cloth around (not on) any protruding bone.', timerSeconds: null },
      { step: 3, title: 'Immobilize the Injury', instruction: 'Splint the limb in the position you found it. Use rolled newspaper, cardboard, or sticks padded with clothing. Extend the splint beyond joints above and below the fracture.', timerSeconds: null },
      { step: 4, title: 'Secure the Splint', instruction: 'Tie splint at 2 points: above and below the fracture. Not too tight — check fingers/toes for circulation (color, warmth, sensation).', timerSeconds: null },
      { step: 5, title: 'Ice Pack for Swelling', instruction: 'Apply ice wrapped in cloth for up to 20 min. Do not apply ice directly to skin.', timerSeconds: 1200 },
      { step: 6, title: 'Treat for Shock', instruction: 'Have person lie down. Keep warm with blanket. Do not elevate legs if spine or leg fracture suspected.', timerSeconds: null },
      { step: 7, title: 'Get Medical Help', instruction: 'All fractures need x-ray confirmation. Call 102 for open fractures (bone visible), pelvis/femur fractures, spinal injuries.', timerSeconds: null },
    ],
    warnings: ['Do NOT move person if spinal injury is suspected', 'Open fracture (bone through skin) = high infection risk — cover with clean cloth, do not push bone back', 'Check circulation (capillary refill) every 5 min after splinting'],
  },
  {
    id: 13, title: 'Seizures', category: 'Common', icon: 'head-dots-horizontal-outline', urgency: 'urgent',
    description: 'Protect, time, and support during and after a seizure',
    symptomTags: ['seizure'],
    steps: [
      { step: 1, title: 'Stay Calm & Note Time', instruction: 'Start timing the seizure NOW. Most last 1–3 minutes and stop on their own. Clear immediate area of hard/sharp objects.', timerSeconds: null },
      { step: 2, title: 'Protect the Head', instruction: 'Place something soft (folded jacket, your hands) under the head. Do not restrain arms, legs, or body.', timerSeconds: null },
      { step: 3, title: 'Turn on Side if Possible', instruction: 'If not actively convulsing or if vomiting: roll gently onto side. This keeps the airway clear.', timerSeconds: null },
      { step: 4, title: 'Do NOT Put Anything in Mouth', instruction: 'Do NOT put fingers, spoon, or anything else in their mouth. They CANNOT swallow their tongue — this is a myth. You will get bitten.', timerSeconds: null },
      { step: 5, title: 'Stay with Them After', instruction: 'After seizure stops, person will be confused and exhausted (postictal state). Speak calmly, reassure them. Stay until fully alert.', timerSeconds: null },
      { step: 6, title: 'When to Call 102', instruction: 'CALL if: seizure lasts >5 minutes, person has another seizure, doesn\'t wake up after, has difficulty breathing, is injured, pregnant, diabetic, or this is their first known seizure.', timerSeconds: null },
    ],
    warnings: ['Never restrain a seizing person — you can cause dislocations or fractures', 'The \'swallow tongue\' myth is false — never put anything in their mouth', 'A person may stop breathing briefly during a seizure — begin CPR only if they do not resume breathing after seizure ends'],
  },
  {
    id: 14, title: 'Head Injury / Concussion', category: 'Common', icon: 'account-alert-outline', urgency: 'urgent',
    description: 'Assess and manage traumatic brain injury',
    symptomTags: ['head_injury', 'unconscious'],
    steps: [
      { step: 1, title: 'Assess Consciousness', instruction: 'Is person conscious? Confused? Ask: name, date, what happened. Watch for: loss of consciousness, even briefly.', timerSeconds: null },
      { step: 2, title: 'Do Not Move if Spinal Injury Possible', instruction: 'If injured from fall, accident, or impact: assume possible spine injury. Keep head, neck, spine aligned. Only move if life-threatening danger.', timerSeconds: null },
      { step: 3, title: 'Control External Bleeding', instruction: 'Apply gentle pressure to scalp wounds. Head wounds bleed heavily — do not be misled by the amount of blood.', timerSeconds: null },
      { step: 4, title: 'Monitor for Red Flags', instruction: 'Watch for: worsening headache, repeated vomiting, seizure, weakness in limbs, slurred speech, unequal pupils, confusion worsening. Any of these = immediate 102 call.', timerSeconds: null },
      { step: 5, title: 'Recovery Position if Unconscious', instruction: 'If unconscious but breathing: carefully place in recovery position (on side) while maintaining spinal alignment.', timerSeconds: null },
      { step: 6, title: 'No Alcohol / Pain Meds', instruction: 'Do not give alcohol. Avoid ibuprofen/aspirin (increase bleeding risk). Paracetamol in small doses is safer if pain relief needed.', timerSeconds: null },
    ],
    warnings: ['Never leave alone for 24 hours after any head injury', 'Do NOT remove helmet if the person is wearing one and spinal injury is possible', 'A "feeling fine" person can deteriorate rapidly — always monitor'],
  },
  {
    id: 15, title: 'Spinal Injury', category: 'Critical', icon: 'human-handsup', urgency: 'critical',
    description: 'Immobilize the spine — wrong movement can cause paralysis',
    symptomTags: ['spinal', 'head_injury'],
    steps: [
      { step: 1, title: 'Do NOT Move the Person', instruction: 'Unless in immediate life-threatening danger (fire, flood). Do not bend, twist, or rotate head/neck/trunk.', timerSeconds: null },
      { step: 2, title: 'Call 102 Immediately', instruction: 'This is a specialist emergency. Paramedics have equipment to move spinal injury patients safely.', timerSeconds: null },
      { step: 3, title: 'Stabilize the Head', instruction: 'Kneel above their head. Place your hands on both sides of their head. Hold gently in the position you found it. Do not straighten if tilted.', timerSeconds: null },
      { step: 4, title: 'Keep Them Calm & Still', instruction: 'Talk to the person. Explain what you are doing. Instruct them not to turn their head. Keep warm with blanket if possible.', timerSeconds: null },
      { step: 5, title: 'If Unconscious: Airway Priority', instruction: 'If not breathing: the life takes priority over spinal precautions. Use jaw-thrust maneuver (not head-tilt) to open airway. Begin CPR if needed.', timerSeconds: null },
    ],
    warnings: ['Do NOT remove helmet — it provides stabilization', 'Do NOT sit them up even if they want to', 'Log-roll technique requires at minimum 3 trained people — do not attempt alone'],
  },
  {
    id: 16, title: 'Drowning / Near-Drowning', category: 'Critical', icon: 'swim', urgency: 'critical',
    description: 'Rescue from water and restore breathing',
    symptomTags: ['drowning', 'not_breathing'],
    steps: [
      { step: 1, title: 'Your Safety First', instruction: 'Do not jump in unless you are a trained rescuer. Throw a rope, lifebuoy, or extend a pole, towel, or clothing.', timerSeconds: null },
      { step: 2, title: 'Call 102 Immediately', instruction: 'Call for emergency help as soon as possible.', timerSeconds: null },
      { step: 3, title: 'Get Person Out of Water', instruction: 'Once safe to approach: support the head and neck if fall or diving injury suspected. Pull to shore.', timerSeconds: null },
      { step: 4, title: 'Check for Breathing', instruction: 'Once on land: is person breathing? Check for chest rise and sounds for up to 10 seconds.', timerSeconds: null },
      { step: 5, title: 'Begin CPR if Not Breathing', instruction: 'For drowning: start with 5 rescue breaths first (not 30 compressions first). Then continue standard CPR 30:2 cycle.', timerSeconds: null },
      { step: 6, title: 'Continue Until Help Arrives', instruction: 'Cold water drowning victims have survived with prolonged CPR. Do NOT stop until medical professionals take over.', timerSeconds: null },
    ],
    warnings: ['Drowning victims should ALWAYS go to hospital — even those who recover quickly (secondary drowning can occur hours later)', 'Do NOT hold person upside-down to drain water', 'Suspect spinal injury in all diving or fall accidents'],
  },

  // ── ENVIRONMENTAL ────────────────────────────────────────────────────────
  {
    id: 17, title: 'Heat Stroke', category: 'Environmental', icon: 'thermometer', urgency: 'critical',
    description: 'Core body temperature dangerously high — organ damage risk',
    symptomTags: ['heatstroke'],
    steps: [
      { step: 1, title: 'Move to Cool Area', instruction: 'Get person out of heat immediately. Into shade, air conditioning, or any cooler environment.', timerSeconds: null },
      { step: 2, title: 'Call 102', instruction: 'Heat stroke is a medical emergency. Call immediately.', timerSeconds: null },
      { step: 3, title: 'Cool the Person Rapidly', instruction: 'This is the priority. Remove excess clothing. Apply cold wet cloths or ice packs to: neck, armpits, and groin (where blood vessels are near surface). Fan them.', timerSeconds: null },
      { step: 4, title: 'Cold Water Immersion (if available)', instruction: 'If possible, immerse in cold water (bath, bucket). This is the fastest cooling method.', timerSeconds: null },
      { step: 5, title: 'Do Not Give Fluids if Confused', instruction: 'Give cool water ONLY if person is conscious and can swallow safely. Do not force fluids.', timerSeconds: null },
      { step: 6, title: 'Monitor Until Help Arrives', instruction: 'Watch breathing. If unconscious, place in recovery position. Be ready for CPR.', timerSeconds: null },
    ],
    warnings: ['Heat stroke temperature can exceed 40°C (104°F) — every minute counts', 'Do NOT give aspirin or paracetamol — they do not work for heat stroke', 'Confusion, slurred speech, or loss of consciousness = heat stroke (not just heat exhaustion)'],
  },
  {
    id: 18, title: 'Hypothermia', category: 'Environmental', icon: 'snowflake', urgency: 'urgent',
    description: 'Dangerously low body temperature — warm gradually',
    symptomTags: ['hypothermia'],
    steps: [
      { step: 1, title: 'Move Inside', instruction: 'Get person away from cold, wind, and wet. Handle GENTLY — cold hearts are prone to cardiac arrest from rough movement.', timerSeconds: null },
      { step: 2, title: 'Remove Wet Clothing', instruction: 'Cut off wet clothes carefully. Replace with dry, warm blankets. Cover head and neck.', timerSeconds: null },
      { step: 3, title: 'Warm Gradually', instruction: 'Warm the body core first (chest, neck, armpits, groin). Do NOT warm limbs first — this can cause cold blood to rush to heart.', timerSeconds: null },
      { step: 4, title: 'Warm Beverages (mild cases only)', instruction: 'If person is conscious and can swallow: warm (not hot) sweet drinks. No alcohol.', timerSeconds: null },
      { step: 5, title: 'Call 102', instruction: 'Moderate to severe hypothermia requires hospital care. Shivering stops in severe cases — this is a bad sign.', timerSeconds: null },
      { step: 6, title: 'CPR if Needed', instruction: 'Check pulse for 60 seconds in hypothermia (pulse is slow and faint). Begin CPR if no pulse. Continue until warmed.', timerSeconds: null },
    ],
    warnings: ['Do NOT rub extremities — this can cause cardiac arrest', 'Do NOT give alcohol — it increases heat loss', '"Not dead until warm and dead" — continue CPR in cold water victims until fully rewarmed'],
  },
  {
    id: 19, title: 'Snakebite', category: 'Environmental', icon: 'exclamation-thick', urgency: 'critical',
    description: 'Venomous or unknown snake bites — act calmly and quickly',
    symptomTags: ['snakebite'],
    steps: [
      { step: 1, title: 'Move Away from Snake', instruction: 'Get person (and yourself) away from the snake. Do not try to catch or kill it — note its appearance if safe to do so.', timerSeconds: null },
      { step: 2, title: 'Keep Still and Calm', instruction: 'Have person sit or lie still. Movement speeds venom spread through lymphatic system. Keep bitten limb below heart level.', timerSeconds: null },
      { step: 3, title: 'Call 102 / Get to Hospital', instruction: 'All snakebites need urgent evaluation — even if bite looks minor or snake appears non-venomous. Time to antivenom matters.', timerSeconds: null },
      { step: 4, title: 'Remove Constrictives', instruction: 'Remove rings, watches, bracelets, and tight clothing near the bite area — swelling will occur rapidly.', timerSeconds: null },
      { step: 5, title: 'Mark the Swelling', instruction: 'Draw a line with pen around edge of swelling and note time. Repeat every 15 minutes. This tracks venom spread for doctors.', timerSeconds: null },
      { step: 6, title: 'Monitor for Symptoms', instruction: 'Venom effects can include: swelling, pain, blurred vision, difficulty swallowing, drooping eyelids, paralysis, excessive bleeding from gums. Report all changes.', timerSeconds: null },
    ],
    warnings: ['Do NOT cut and suck the wound', 'Do NOT apply tourniquet or ice', 'Do NOT give alcohol or herbal remedies', 'Do NOT use electric shock (a dangerous myth)'],
  },

  // ── COMMON CONDITIONS ────────────────────────────────────────────────────
  {
    id: 20, title: 'Diabetic Emergency', category: 'Common', icon: 'needle', urgency: 'urgent',
    description: 'Low or high blood sugar emergency',
    symptomTags: ['diabetic', 'unconscious'],
    steps: [
      { step: 1, title: 'Identify Type of Emergency', instruction: 'Low blood sugar (hypoglycemia): shakiness, sweating, confusion, hunger, pale. High blood sugar (hyperglycemia): extreme thirst, frequent urination, fruity breath, slow onset.', timerSeconds: null },
      { step: 2, title: 'If Conscious — Give Sugar', instruction: 'For low blood sugar ONLY (most diabetic emergencies are low): give 15–20g fast-acting sugar. 3–4 glucose tablets, 150ml fruit juice, or 4–5 sugar cubes. Do not give if you are unsure which type.', timerSeconds: null },
      { step: 3, title: 'Wait 15 Minutes', instruction: 'After sugar intake, wait 15 min and reassess. If no improvement, give another dose.', timerSeconds: 900 },
      { step: 4, title: 'Follow with Slow-Release Food', instruction: 'Once improved: give a snack with complex carbs (crackers, bread) to stabilize blood sugar.', timerSeconds: null },
      { step: 5, title: 'If Unconscious — Call 102', instruction: 'Do NOT give anything by mouth to an unconscious person. Place in recovery position. Call 102 immediately.', timerSeconds: null },
      { step: 6, title: 'Inject Glucagon if Available', instruction: 'If unconscious and glucagon kit is available: follow kit instructions. Inject into thigh or arm.', timerSeconds: null },
    ],
    warnings: ['When in doubt, give sugar — it helps hypoglycemia and won\'t critically worsen hyperglycemia short-term', 'Do NOT give food or drink to unconscious persons'],
  },
  {
    id: 21, title: 'Eye Injury / Chemical Splash', category: 'Common', icon: 'eye-outline', urgency: 'urgent',
    description: 'Protect vision with immediate proper eye care',
    symptomTags: ['eye_injury'],
    steps: [
      { step: 1, title: 'Do NOT Rub the Eye', instruction: 'Rubbing embeds particles deeper and spreads chemicals. Keep hands away from eye.', timerSeconds: null },
      { step: 2, title: 'Chemical Splash — Flush Immediately', instruction: 'Tilt head so affected eye is down. Pour clean water continuously over the open eye for 20 full minutes. Remove contact lenses first if easy.', timerSeconds: 1200 },
      { step: 3, title: 'Foreign Object (Particle)', instruction: 'Blink rapidly under water. Lift upper lid over lower. Do NOT remove object if it is embedded or large. Cover loosely.', timerSeconds: null },
      { step: 4, title: 'Penetrating Injury', instruction: 'If object is sticking out of eye: DO NOT remove it. Cover BOTH eyes with clean cloth (moving unaffected eye moves affected eye too). Call 102.', timerSeconds: null },
      { step: 5, title: 'Seek Medical Attention', instruction: 'All chemical splashes, penetrating injuries, and persistent pain/vision changes need emergency eye care.', timerSeconds: null },
    ],
    warnings: ['NEVER remove a penetrating eye object', 'Cover BOTH eyes for penetrating injury', 'Contact lenses must be removed before flushing with chemicals if possible without rubbing'],
  },
  {
    id: 22, title: 'Asthma Attack', category: 'Common', icon: 'weather-windy', urgency: 'urgent',
    description: 'Open the airway during an acute asthma attack',
    symptomTags: ['not_breathing', 'allergic'],
    steps: [
      { step: 1, title: 'Sit Person Upright', instruction: 'Sit person forward, leaning slightly forward with hands on knees. Do NOT lay flat. Loosen tight clothing.', timerSeconds: null },
      { step: 2, title: 'Use Reliever Inhaler', instruction: 'Blue/reliever inhaler (usually Salbutamol): shake, give 1 puff every 30–60 seconds via spacer. Up to 10 puffs maximum.', timerSeconds: null },
      { step: 3, title: 'Wait and Reassess', instruction: 'Wait 15 minutes after 10 puffs. If improving, continue monitoring. Seek medical review even if improved.', timerSeconds: 900 },
      { step: 4, title: 'Call 102 if Not Improving', instruction: 'Call immediately if: not improving after 10 puffs, too breathless to talk, lips turning blue, exhausted/silent chest (very dangerous).', timerSeconds: null },
      { step: 5, title: 'Repeat Inhaler While Waiting', instruction: 'While waiting for ambulance, continue giving 10 puffs every 15 minutes.', timerSeconds: null },
    ],
    warnings: ['Silent chest (no wheeze despite severe distress) is a VERY dangerous sign', 'Do NOT give sedatives or antihistamines during asthma attack', 'Brown/preventer inhaler does not help in an acute attack — only use blue/reliever'],
  },
  {
    id: 23, title: 'Nosebleed', category: 'Common', icon: 'emoticon-sad-outline', urgency: 'minor',
    description: 'Stop nasal bleeding quickly and safely',
    symptomTags: ['heavy_bleeding'],
    steps: [
      { step: 1, title: 'Sit Upright, Lean Forward', instruction: 'Sit person upright, leaning slightly forward (not backward). This prevents blood from going down the throat.', timerSeconds: null },
      { step: 2, title: 'Pinch Soft Part of Nose', instruction: 'Pinch the SOFT part of the nose (below the bony bridge) firmly. Breathe through the mouth.', timerSeconds: null },
      { step: 3, title: 'Hold for 10–15 Minutes', instruction: 'Do not release to check — maintain pressure for the full time.', timerSeconds: 900 },
      { step: 4, title: 'Apply Cold Compress', instruction: 'Place cold cloth or ice pack (wrapped) on bridge of nose and back of neck.', timerSeconds: null },
      { step: 5, title: 'After Bleeding Stops', instruction: 'Avoid blowing nose for several hours. Avoid strenuous activity for the rest of the day.', timerSeconds: null },
      { step: 6, title: 'When to Seek Help', instruction: 'Seek help if: bleeding does not stop after 20 min, from head injury, blood is swallowed (causes vomiting), or person is on blood thinners.', timerSeconds: null },
    ],
    warnings: ['Do NOT tilt head back — blood goes into stomach and causes vomiting', 'Do NOT pack nose with tissue unless needed — it may restart bleeding when removed'],
  },
  {
    id: 24, title: 'Fainting / Vasovagal Syncope', category: 'Common', icon: 'account-off', urgency: 'minor',
    description: 'Brief loss of consciousness — usually harmless',
    symptomTags: ['unconscious'],
    steps: [
      { step: 1, title: 'Catch & Lower Safely', instruction: 'If person is about to faint: lower them to the floor gently. Catch if possible to prevent a fall.', timerSeconds: null },
      { step: 2, title: 'Lay Flat & Elevate Legs', instruction: 'Lay person on back. Raise legs 15–30 cm above heart level. This improves blood flow to brain.', timerSeconds: null },
      { step: 3, title: 'Loosen Tight Clothing', instruction: 'Undo collar, belt, and anything tight. Ensure fresh air.', timerSeconds: null },
      { step: 4, title: 'Allow Recovery', instruction: 'Person should recover within 1–2 minutes. Do not rush them to sit up.', timerSeconds: 120 },
      { step: 5, title: 'Sit Up Slowly', instruction: 'When conscious: have them roll onto side first, then slowly sit up, wait 2 minutes, then stand.', timerSeconds: null },
      { step: 6, title: 'When to Call 102', instruction: 'Call if: unconscious >2 min, has chest pain, no pulse, seizure, is pregnant, or injury from fall.', timerSeconds: null },
    ],
    warnings: ['Do NOT give water until fully conscious', 'Do NOT leave alone until fully recovered'],
  },
  {
    id: 25, title: 'Dislocations', category: 'Common', icon: 'human-handsdown', urgency: 'urgent',
    description: 'Joint displaced from normal position',
    symptomTags: ['fracture'],
    steps: [
      { step: 1, title: 'Do NOT Try to Relocate', instruction: 'Do NOT try to push the joint back. This requires medical training and can cause fractures, nerve, or blood vessel damage.', timerSeconds: null },
      { step: 2, title: 'Immobilize in Position', instruction: 'Support the limb in the position you find it. Use sling for shoulder, splint for other joints.', timerSeconds: null },
      { step: 3, title: 'Apply Ice', instruction: 'Apply ice pack wrapped in cloth to reduce swelling and pain. Max 20 minutes on.', timerSeconds: 1200 },
      { step: 4, title: 'Elevate if Possible', instruction: 'Elevate the injured limb above heart level if it can be done comfortably.', timerSeconds: null },
      { step: 5, title: 'Seek Medical Help', instruction: 'All dislocations need X-ray and professional reduction. Go to emergency department.', timerSeconds: null },
    ],
    warnings: ['Attempting to relocate a joint without training causes serious damage', 'A dislocation may have a fracture too — always get X-rayed'],
  },
  {
    id: 26, title: 'Chest Wound (Open)', category: 'Critical', icon: 'heart-outline', urgency: 'critical',
    description: 'Penetrating chest wound — seal to prevent lung collapse',
    symptomTags: ['heavy_bleeding', 'not_breathing'],
    steps: [
      { step: 1, title: 'Call 102', instruction: 'This is a critical emergency. Call immediately.', timerSeconds: null },
      { step: 2, title: 'Seal the Wound (3 Sides)', instruction: 'Cover wound with a clean airtight material (plastic wrap, sealed dressing). Tape on 3 sides only — leave one side open. This acts as a one-way valve preventing air from entering.', timerSeconds: null },
      { step: 3, title: 'Sit Upright If Possible', instruction: 'Support person in an upright or semi-reclined position to ease breathing.', timerSeconds: null },
      { step: 4, title: 'Monitor for Tension Pneumothorax', instruction: 'Signs: increasing difficulty breathing, trachea shifting to one side, decreasing oxygen. If this occurs, briefly lift one corner of the seal to let air escape, then reseal.', timerSeconds: null },
      { step: 5, title: 'Do NOT Remove Impaled Objects', instruction: 'Stabilize any impaled object in place. Do not remove.', timerSeconds: null },
    ],
    warnings: ['Do NOT seal all 4 sides — this can cause tension pneumothorax', 'Do NOT remove any object impaled in the chest'],
  },
  {
    id: 27, title: 'Abdominal Wound (Evisceration)', category: 'Critical', icon: 'water-outline', urgency: 'critical',
    description: 'Severe abdominal wound with organs exposed',
    symptomTags: ['heavy_bleeding'],
    steps: [
      { step: 1, title: 'Call 102 Immediately', instruction: 'Do not delay. This is a surgical emergency.', timerSeconds: null },
      { step: 2, title: 'Do NOT Push Organs Back', instruction: 'NEVER push any exposed intestines or tissue back into the wound. Lay person on their back, knees slightly bent if possible.', timerSeconds: null },
      { step: 3, title: 'Cover with Moist Dressing', instruction: 'Cover exposed organs with clean cloths moistened with clean water or saline. Keep them moist and warm.', timerSeconds: null },
      { step: 4, title: 'Do Not Apply Direct Pressure', instruction: 'Do not press down on the covered organs.', timerSeconds: null },
      { step: 5, title: 'Keep Warm & Treat for Shock', instruction: 'Cover person with blanket. Keep calm. Monitor breathing.', timerSeconds: null },
    ],
    warnings: ['Do NOT give food, water, or oral medications', 'Do NOT remove impaled objects'],
  },
  {
    id: 28, title: 'Sprains and Strains', category: 'Common', icon: 'human-walking', urgency: 'minor',
    description: 'RICE method for soft tissue injuries',
    symptomTags: ['fracture'],
    steps: [
      { step: 1, title: 'R — Rest', instruction: 'Stop activity immediately. Do not put weight on injured area.', timerSeconds: null },
      { step: 2, title: 'I — Ice', instruction: 'Apply ice pack wrapped in cloth for 20 minutes. Repeat every 2 hours for first 48 hours.', timerSeconds: 1200 },
      { step: 3, title: 'C — Compression', instruction: 'Wrap injury with elastic bandage. Firm but not tight — check circulation (wiggle fingers/toes).', timerSeconds: null },
      { step: 4, title: 'E — Elevation', instruction: 'Raise injured limb above heart level to reduce swelling.', timerSeconds: null },
      { step: 5, title: 'Pain Relief', instruction: 'Ibuprofen reduces both pain and inflammation. Follow dosage instructions.', timerSeconds: null },
      { step: 6, title: 'When to Seek Help', instruction: 'See a doctor if: unable to bear weight, severe swelling, suspected fracture, no improvement in 48–72 hours.', timerSeconds: null },
    ],
    warnings: ['Avoid heat, alcohol, running in first 72 hours (HARM)', 'If in doubt between sprain and fracture, treat as fracture and get X-rayed'],
  },
  {
    id: 29, title: 'Tooth / Dental Emergency', category: 'Common', icon: 'tooth-outline', urgency: 'minor',
    description: 'Save a knocked-out tooth and manage dental trauma',
    symptomTags: [],
    steps: [
      { step: 1, title: 'Find the Tooth', instruction: 'Handle tooth by the crown (top white part). Do NOT touch the root.', timerSeconds: null },
      { step: 2, title: 'Clean Gently', instruction: 'If dirty, rinse gently with milk or saline for 10 seconds. Do NOT scrub, scrape, or use water.', timerSeconds: null },
      { step: 3, title: 'Reinsert if Possible', instruction: 'Try to place tooth back in socket immediately (within 30 min greatly improves success). Push in, bite down gently on cloth to hold.', timerSeconds: null },
      { step: 4, title: 'Storage if Cannot Reinsert', instruction: 'Place tooth in: cold milk (best), inside cheek of conscious adult, or saline. Do NOT store dry or in water.', timerSeconds: null },
      { step: 5, title: 'See Dentist Within 1 Hour', instruction: 'Speed is critical. Within 30 min: 90% chance of re-implantation success. After 2 hours: very low chance.', timerSeconds: null },
    ],
    warnings: ['Do NOT reimplant baby teeth — can damage developing permanent tooth', 'Do NOT touch the root', 'Do NOT store in plain water'],
  },
  {
    id: 30, title: 'Suspected Poisoning (Child)', category: 'Pediatric', icon: 'human-child', urgency: 'critical',
    description: 'Child has ingested medication, chemical, or toxic substance',
    symptomTags: ['poisoning', 'child_involved'],
    steps: [
      { step: 1, title: 'Stay Calm & Identify Substance', instruction: 'Find the container or substance. Note the name, amount, and when it was ingested.', timerSeconds: null },
      { step: 2, title: 'Call 102 or Poison Control', instruction: 'Poison Control (India): 1800-116-117. Call immediately — even if child seems fine. Give exact details.', timerSeconds: null },
      { step: 3, title: 'Do NOT Induce Vomiting', instruction: 'Unless specifically told to by medical professionals. Can cause additional harm with caustic substances.', timerSeconds: null },
      { step: 4, title: 'Do NOT Give Food, Milk, or Water', instruction: 'Unless specifically instructed by poison control.', timerSeconds: null },
      { step: 5, title: 'If Unconscious', instruction: 'Recovery position. Open airway. Begin CPR if not breathing. Call 102 if not already done.', timerSeconds: null },
      { step: 6, title: 'Bring Container to Hospital', instruction: 'Bring the original container with you. It helps doctors identify the exact substance and appropriate treatment.', timerSeconds: null },
    ],
    warnings: ['Do NOT use home remedies like salt water, raw egg, or milk unless specifically instructed', 'Lock away all medications and chemicals after this event'],
  },
  {
    id: 31, title: 'Febrile Convulsions (Child)', category: 'Pediatric', icon: 'thermometer', urgency: 'urgent',
    description: 'Seizure triggered by high fever in children 6 months–5 years',
    symptomTags: ['seizure', 'child_involved'],
    steps: [
      { step: 1, title: 'Stay Calm — Most Stop in <5 Min', instruction: 'These are usually harmless, though terrifying to witness. They are caused by rapid rise in body temperature.', timerSeconds: null },
      { step: 2, title: 'Place Safely on Side', instruction: 'Gently roll child on their side. Clear area of hard/sharp objects. Cushion head.', timerSeconds: null },
      { step: 3, title: 'Time the Seizure', instruction: 'Note start time. If seizure lasts >5 minutes, call 102.', timerSeconds: null },
      { step: 4, title: 'Do Not Put Anything in Mouth', instruction: 'Do NOT put fingers, spoon, or objects in mouth.', timerSeconds: null },
      { step: 5, title: 'Do Not Restrain', instruction: 'Do not hold the child down. Let the seizure run its course.', timerSeconds: null },
      { step: 6, title: 'Cool Child After Seizure Stops', instruction: 'Remove excess clothing. Give age-appropriate dose of paracetamol/ibuprofen for fever. Seek medical evaluation.', timerSeconds: null },
    ],
    warnings: ['ALL first-time febrile convulsions need medical evaluation, even if brief', 'Call 102 if seizure lasts >5 min, child cannot be roused, has multiple seizures, or is under 6 months'],
  },
  {
    id: 32, title: 'Bee / Wasp Sting', category: 'Common', icon: 'flower-outline', urgency: 'minor',
    description: 'Remove sting and monitor for allergic reaction',
    symptomTags: ['allergic'],
    steps: [
      { step: 1, title: 'Remove Stinger', instruction: 'For bee stings (wasps don\'t leave stingers): scrape stinger out sideways using a credit card or fingernail edge. Do NOT squeeze or use tweezers (this injects more venom).', timerSeconds: null },
      { step: 2, title: 'Wash and Cool', instruction: 'Wash area with soap and water. Apply cold pack wrapped in cloth for 20 min to reduce pain and swelling.', timerSeconds: 1200 },
      { step: 3, title: 'Monitor for Allergy', instruction: 'Watch for 30+ minutes for signs of anaphylaxis: hives spreading beyond sting site, swelling of face/throat, difficulty breathing, dizziness.', timerSeconds: null },
      { step: 4, title: 'If Anaphylaxis Signs Appear', instruction: 'Use EpiPen if available. Call 102 immediately. Treat as anaphylaxis emergency.', timerSeconds: null },
      { step: 5, title: 'Pain and Itch Relief', instruction: 'Antihistamine cream or tablet reduces itch/swelling. Hydrocortisone cream for inflammation. Paracetamol for pain.', timerSeconds: null },
    ],
    warnings: ['Multiple stings (50+) can cause systemic reaction even without prior allergy — call 102', 'If stung in the mouth or throat — call 102 immediately (airway swelling risk)'],
  },
  {
    id: 33, title: 'Dehydration & Heat Exhaustion', category: 'Environmental', icon: 'water-alert', urgency: 'urgent',
    description: 'Fluid and electrolyte loss from heat or illness',
    symptomTags: ['heatstroke'],
    steps: [
      { step: 1, title: 'Move to Cool Environment', instruction: 'Get person into shade, air conditioning, or a cool room.', timerSeconds: null },
      { step: 2, title: 'Lie Down, Legs Elevated', instruction: 'Lay person down and raise legs above heart level. Loosen tight clothing.', timerSeconds: null },
      { step: 3, title: 'Rehydrate — Oral Rehydration', instruction: 'If conscious: give ORS (oral rehydration salts) or small sips of cool water. ORS recipe: 1L water + 6 tsp sugar + 0.5 tsp salt.', timerSeconds: null },
      { step: 4, title: 'Apply Cool Wet Cloths', instruction: 'Apply damp cloths to skin. Fan the person to encourage evaporative cooling.', timerSeconds: null },
      { step: 5, title: 'Monitor and Rest', instruction: 'Should improve within 30 min. Rest for at least 24 hours. Continue fluid intake.', timerSeconds: 1800 },
      { step: 6, title: 'When to Call 102', instruction: 'Call if: symptoms don\'t improve in 30 min, person is confused or unconscious, stops urinating, or has not urinated in 8+ hours.', timerSeconds: null },
    ],
    warnings: ['If confused or unconscious: do NOT give oral fluids — call 102 for IV fluids', 'Heat exhaustion can progress to heat stroke rapidly — act early'],
  },
  {
    id: 34, title: 'Wound Care (Minor)', category: 'Common', icon: 'medical-bag', urgency: 'minor',
    description: 'Clean and dress minor cuts, lacerations, and abrasions',
    symptomTags: ['heavy_bleeding'],
    steps: [
      { step: 1, title: 'Wash Hands First', instruction: 'Wash your hands thoroughly with soap and water before treating the wound.', timerSeconds: null },
      { step: 2, title: 'Stop Bleeding', instruction: 'Apply firm pressure with clean cloth for 5–10 minutes. Minor wounds stop with sustained pressure.', timerSeconds: 600 },
      { step: 3, title: 'Clean the Wound', instruction: 'Once bleeding stops: rinse with clean running water for at least 5 minutes. Remove visible debris with tweezers cleaned in alcohol.', timerSeconds: 300 },
      { step: 4, title: 'Apply Antiseptic', instruction: 'Apply povidone-iodine or chlorhexidine around (not deep into) wound edges.', timerSeconds: null },
      { step: 5, title: 'Cover with Dressing', instruction: 'Apply non-stick sterile pad and bandage or adhesive plaster. Change dressing daily and whenever wet/dirty.', timerSeconds: null },
      { step: 6, title: 'Watch for Infection Signs', instruction: 'Over next days, watch for: increasing redness, warmth, swelling, pus, or red streaks spreading from wound. These need medical attention.', timerSeconds: null },
    ],
    warnings: ['See a doctor for: deep wounds, wounds with ragged edges >2.5 cm, animal bites, wounds that won\'t stop bleeding, or if tetanus vaccination is not up to date', 'Do NOT use cotton wool directly on wound — fibers stick and slow healing'],
  },
  {
    id: 35, title: 'Shock (Circulatory)', category: 'Critical', icon: 'alert', urgency: 'critical',
    description: 'Insufficient blood flow to organs — treat the underlying cause',
    symptomTags: ['unconscious', 'heavy_bleeding'],
    steps: [
      { step: 1, title: 'Recognize Shock', instruction: 'Signs: pale, cold, clammy skin; rapid weak pulse; rapid shallow breathing; confusion; feeling faint or anxious; thirst.', timerSeconds: null },
      { step: 2, title: 'Call 102 Immediately', instruction: 'Shock is life-threatening and requires emergency medical treatment.', timerSeconds: null },
      { step: 3, title: 'Treat the Cause', instruction: 'Stop any bleeding. Use EpiPen if anaphylaxis. Perform CPR if cardiac arrest.', timerSeconds: null },
      { step: 4, title: 'Lay Flat, Elevate Legs', instruction: 'Lay person on their back. Raise legs 20–30 cm (unless leg fracture, spinal injury, or chest wound). Do NOT put pillow under head.', timerSeconds: null },
      { step: 5, title: 'Keep Warm', instruction: 'Cover with blanket. Do not let them get cold. Do not apply external heat (hot water bottle).', timerSeconds: null },
      { step: 6, title: 'Do Not Give Food or Drink', instruction: 'Nothing by mouth. Monitor breathing. Reassure the person. Be ready for CPR.', timerSeconds: null },
    ],
    warnings: ['Do NOT raise legs if spinal injury, leg fracture, or chest wound is suspected', 'Do NOT give alcohol, food, or water', 'Do NOT leave person alone'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Critical', 'Common', 'Environmental', 'Pediatric'];
const CATEGORY_COLORS = {
  Critical: '#D32F2F',
  Common: '#E65100',
  Environmental: '#2E7D32',
  Pediatric: '#1565C0',
};
const URGENCY_COLORS = { critical: '#D32F2F', urgent: '#E65100', minor: '#388E3C' };

// ─────────────────────────────────────────────────────────────────────────────
// GUIDED TIMER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function GuidedMode({ guide, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const step = guide.steps[currentStep];
  const isLastStep = currentStep === guide.steps.length - 1;

  useEffect(() => {
    setTimeLeft(step.timerSeconds);
    setIsTimerRunning(false);
    setTimerDone(false);
    progressAnim.setValue(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [currentStep]);

  const startTimer = () => {
    if (!step.timerSeconds) return;
    setIsTimerRunning(true);
    const total = step.timerSeconds;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: total * 1000,
      useNativeDriver: false,
    }).start();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsTimerRunning(false);
          setTimerDone(true);
          Vibration.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (secs) => {
    if (!secs && secs !== 0) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  };

  const goNext = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isLastStep) setCurrentStep((p) => p + 1);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={gStyles.container}>
      {/* Header */}
      <View style={gStyles.header}>
        <TouchableOpacity onPress={onClose} style={gStyles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={gStyles.headerTitle} numberOfLines={1}>{guide.title}</Text>
        <Text style={gStyles.stepCounter}>{currentStep + 1}/{guide.steps.length}</Text>
      </View>

      {/* Overall progress bar */}
      <View style={gStyles.overallProgressBg}>
        <View style={[gStyles.overallProgressFill, { width: `${((currentStep + 1) / guide.steps.length) * 100}%` }]} />
      </View>

      <ScrollView style={gStyles.scroll} contentContainerStyle={gStyles.scrollContent}>
        {/* Step dots */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={gStyles.dotsRow}>
          {guide.steps.map((_, i) => (
            <View key={i} style={[gStyles.dot, i === currentStep && gStyles.dotActive, i < currentStep && gStyles.dotDone]} />
          ))}
        </ScrollView>

        {/* Step Card */}
        <View style={[gStyles.stepCard, { borderLeftColor: URGENCY_COLORS[guide.urgency] }]}>
          <View style={[gStyles.stepBadge, { backgroundColor: URGENCY_COLORS[guide.urgency] }]}>
            <Text style={gStyles.stepBadgeText}>STEP {step.step}</Text>
          </View>
          <Text style={gStyles.stepTitle}>{step.title}</Text>
          <Text style={gStyles.stepInstruction}>{step.instruction}</Text>
        </View>

        {/* Timer Section */}
        {step.timerSeconds && (
          <View style={gStyles.timerBox}>
            <View style={gStyles.timerHeader}>
              <MaterialCommunityIcons name="timer-outline" size={22} color="#8B0000" />
              <Text style={gStyles.timerLabel}>Timed Step</Text>
            </View>

            <Text style={gStyles.timerDisplay}>
              {isTimerRunning || timerDone ? formatTime(timeLeft) : formatTime(step.timerSeconds)}
            </Text>

            {/* Timer progress bar */}
            <View style={gStyles.timerBarBg}>
              <Animated.View style={[gStyles.timerBarFill, { width: progressWidth, backgroundColor: timerDone ? '#388E3C' : '#8B0000' }]} />
            </View>

            {timerDone ? (
              <View style={gStyles.timerDoneBanner}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#388E3C" />
                <Text style={gStyles.timerDoneText}>Time's up! You can proceed.</Text>
              </View>
            ) : (
              !isTimerRunning && (
                <TouchableOpacity style={gStyles.startTimerBtn} onPress={startTimer}>
                  <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                  <Text style={gStyles.startTimerBtnText}>Start Timer</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={gStyles.navRow}>
        {currentStep > 0 && (
          <TouchableOpacity style={gStyles.prevBtn} onPress={() => setCurrentStep((p) => p - 1)}>
            <Ionicons name="chevron-back" size={20} color="#8B0000" />
            <Text style={gStyles.prevBtnText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[gStyles.nextBtn, { opacity: (step.timerSeconds && isTimerRunning) ? 0.4 : 1 }]}
          onPress={isLastStep ? onClose : goNext}
          disabled={!!(step.timerSeconds && isTimerRunning)}
        >
          <Text style={gStyles.nextBtnText}>{isLastStep ? 'Done ✓' : 'Next Step'}</Text>
          {!isLastStep && <Ionicons name="chevron-forward" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM CHECKER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function SymptomChecker({ onSelectGuide, onClose }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const matches = firstAidGuides
    .map((g) => ({
      ...g,
      score: g.symptomTags.filter((t) => selected.includes(t)).length,
    }))
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <SafeAreaView style={scStyles.container}>
      <View style={scStyles.header}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
        <Text style={scStyles.headerTitle}>Symptom Checker</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={scStyles.instruction}>Select all symptoms you observe:</Text>

        <View style={scStyles.symptomsGrid}>
          {SYMPTOMS.map((s) => {
            const isSelected = selected.includes(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[scStyles.symptomChip, isSelected && scStyles.symptomChipSelected]}
                onPress={() => toggle(s.id)}
              >
                <MaterialCommunityIcons
                  name={s.icon}
                  size={18}
                  color={isSelected ? '#fff' : '#8B0000'}
                />
                <Text style={[scStyles.symptomLabel, isSelected && scStyles.symptomLabelSelected]}>
                  {s.label}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.length > 0 && (
          <>
            <View style={scStyles.divider} />
            <Text style={scStyles.resultsTitle}>
              {matches.length > 0 ? `${matches.length} Matching Guide${matches.length > 1 ? 's' : ''}` : 'No matches — try adding more symptoms'}
            </Text>
            {matches.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[scStyles.matchCard, { borderLeftColor: URGENCY_COLORS[g.urgency] }]}
                onPress={() => onSelectGuide(g)}
              >
                <View style={[scStyles.matchIcon, { backgroundColor: URGENCY_COLORS[g.urgency] + '22' }]}>
                  <MaterialCommunityIcons name={g.icon} size={28} color={URGENCY_COLORS[g.urgency]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={scStyles.matchTitle}>{g.title}</Text>
                  <Text style={scStyles.matchDesc}>{g.description}</Text>
                  <View style={scStyles.matchMeta}>
                    <View style={[scStyles.matchBadge, { backgroundColor: URGENCY_COLORS[g.urgency] }]}>
                      <Text style={scStyles.matchBadgeText}>{g.category}</Text>
                    </View>
                    <Text style={scStyles.matchScore}>{g.score} symptom{g.score > 1 ? 's' : ''} matched</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#aaa" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {selected.length === 0 && (
          <View style={scStyles.emptyHint}>
            <MaterialCommunityIcons name="gesture-tap" size={48} color="#DDD" />
            <Text style={scStyles.emptyHintText}>Tap the symptoms you see to find the right guide</Text>
          </View>
        )}
      </ScrollView>

      {selected.length > 0 && (
        <TouchableOpacity style={scStyles.clearBtn} onPress={() => setSelected([])}>
          <Text style={scStyles.clearBtnText}>Clear All Symptoms</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDE DETAIL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function GuideDetail({ guide, onClose, onStartGuided }) {
  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={[styles.modalHeader, { backgroundColor: URGENCY_COLORS[guide.urgency] }]}>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
        <Text style={styles.modalTitle} numberOfLines={1}>{guide.title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
        {guide.urgency === 'critical' && (
          <View style={styles.emergencyCallBanner}>
            <MaterialCommunityIcons name="alert" size={22} color="#fff" />
            <Text style={styles.emergencyCallText}>Call 102 immediately for this emergency!</Text>
          </View>
        )}

        <Text style={styles.modalDescription}>{guide.description}</Text>

        {/* Start Guided Mode Banner */}
        <TouchableOpacity style={styles.guidedModeBtn} onPress={onStartGuided}>
          <MaterialCommunityIcons name="play-circle" size={26} color="#fff" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.guidedModeBtnTitle}>Start Guided Mode</Text>
            <Text style={styles.guidedModeBtnSub}>Step-by-step with live timers</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
        {guide.steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={[styles.stepNumber, { backgroundColor: URGENCY_COLORS[guide.urgency] }]}>
              <Text style={styles.stepNumberText}>{step.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
              {step.timerSeconds && (
                <View style={styles.stepTimerPill}>
                  <MaterialCommunityIcons name="timer-outline" size={12} color="#8B0000" />
                  <Text style={styles.stepTimerPillText}>{Math.floor(step.timerSeconds / 60) > 0 ? `${Math.floor(step.timerSeconds / 60)} min timer` : `${step.timerSeconds}s timer`}</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {guide.warnings?.length > 0 && (
          <>
            <View style={styles.warningsHeader}>
              <MaterialCommunityIcons name="alert-circle" size={22} color="#E65100" />
              <Text style={styles.warningsTitle}>Important Warnings</Text>
            </View>
            <View style={styles.warningsBox}>
              {guide.warnings.map((w, i) => (
                <View key={i} style={styles.warningItem}>
                  <Text style={styles.warningBullet}>⚠</Text>
                  <Text style={styles.warningText}>{w}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.disclaimerBox}>
          <MaterialCommunityIcons name="information" size={18} color="#666" />
          <Text style={styles.disclaimerText}>
            For informational purposes only. Always seek professional medical help in emergencies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function FirstAidScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showGuided, setShowGuided] = useState(false);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const filtered = firstAidGuides.filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || g.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const openGuide = (guide) => {
    setSelectedGuide(guide);
    setShowDetail(true);
  };

  const openFromSymptomChecker = (guide) => {
    setShowSymptomChecker(false);
    setTimeout(() => {
      setSelectedGuide(guide);
      setShowDetail(true);
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={18} color="#8B0000" />
        <Text style={styles.infoBannerText}>
          Reference only. Call 102 immediately for serious emergencies.
        </Text>
      </View>

      {/* Symptom Checker Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginHorizontal: 16, marginTop: 12 }}>
        <TouchableOpacity style={styles.symptomCheckerBtn} onPress={() => setShowSymptomChecker(true)}>
          <View style={styles.scBtnLeft}>
            <MaterialCommunityIcons name="clipboard-pulse" size={28} color="#fff" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.scBtnTitle}>Symptom Checker</Text>
              <Text style={styles.scBtnSub}>Don't know what's happening? Start here →</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search emergency situations..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, selectedCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] || '#8B0000', borderColor: CATEGORY_COLORS[cat] || '#8B0000' }]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryBtnText, selectedCategory === cat && styles.categoryBtnTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={styles.countLabel}>{filtered.length} guide{filtered.length !== 1 ? 's' : ''}</Text>

      {/* Guides List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.map((guide) => (
          <TouchableOpacity key={guide.id} style={styles.guideCard} onPress={() => openGuide(guide)} activeOpacity={0.75}>
            <View style={[styles.iconContainer, { backgroundColor: URGENCY_COLORS[guide.urgency] + '18' }]}>
              <MaterialCommunityIcons name={guide.icon} size={30} color={URGENCY_COLORS[guide.urgency]} />
            </View>
            <View style={styles.guideInfo}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDescription} numberOfLines={1}>{guide.description}</Text>
              <View style={styles.guideMeta}>
                <View style={[styles.urgencyBadge, { backgroundColor: URGENCY_COLORS[guide.urgency] }]}>
                  <Text style={styles.urgencyText}>{guide.category}</Text>
                </View>
                <Text style={styles.stepsCount}>{guide.steps.length} steps</Text>
                {guide.steps.some((s) => s.timerSeconds) && (
                  <View style={styles.timerIndicator}>
                    <MaterialCommunityIcons name="timer-outline" size={12} color="#8B0000" />
                    <Text style={styles.timerIndicatorText}>Has timers</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="magnify-close" size={56} color="#DDD" />
            <Text style={styles.emptyText}>No guides found</Text>
            <Text style={styles.emptySubtext}>Try a different search or category</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Guide Detail Modal */}
      <Modal visible={showDetail} animationType="slide" onRequestClose={() => setShowDetail(false)}>
        {selectedGuide && !showGuided && (
          <GuideDetail
            guide={selectedGuide}
            onClose={() => setShowDetail(false)}
            onStartGuided={() => setShowGuided(true)}
          />
        )}
        {selectedGuide && showGuided && (
          <GuidedMode
            guide={selectedGuide}
            onClose={() => { setShowGuided(false); setShowDetail(false); }}
          />
        )}
      </Modal>

      {/* Symptom Checker Modal */}
      <Modal visible={showSymptomChecker} animationType="slide" onRequestClose={() => setShowSymptomChecker(false)}>
        <SymptomChecker
          onSelectGuide={openFromSymptomChecker}
          onClose={() => setShowSymptomChecker(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES — MAIN
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  infoBanner: {
    backgroundColor: '#FFF3F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B0000',
  },
  infoBannerText: { flex: 1, marginLeft: 8, fontSize: 12, color: '#555', lineHeight: 17 },
  symptomCheckerBtn: {
    backgroundColor: '#8B0000',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scBtnLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  scBtnTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#333' },
  categoryScroll: { marginTop: 12, flexGrow: 0 },
  categoryContent: { paddingHorizontal: 16, paddingVertical: 2, flexDirection: 'row' },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginRight: 8,
    flexShrink: 0,
  },
  categoryBtnText: { fontSize: 13, fontWeight: '600', color: '#666' },
  categoryBtnTextActive: { color: '#fff' },
  countLabel: { fontSize: 12, color: '#999', marginHorizontal: 16, marginTop: 10, marginBottom: 4 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  guideCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  guideInfo: { flex: 1 },
  guideTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 3 },
  guideDescription: { fontSize: 12, color: '#777', marginBottom: 7 },
  guideMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  urgencyBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  urgencyText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  stepsCount: { fontSize: 12, color: '#aaa' },
  timerIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF3F3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  timerIndicatorText: { fontSize: 10, color: '#8B0000' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#bbb', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#ccc', marginTop: 4 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#F7F7F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', marginHorizontal: 10 },
  modalContent: { flex: 1 },
  modalScrollContent: { padding: 18 },
  emergencyCallBanner: { backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 16 },
  emergencyCallText: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: '#fff' },
  modalDescription: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 18, fontStyle: 'italic' },
  guidedModeBtn: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 22,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  guidedModeBtnTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guidedModeBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 14 },
  stepCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  stepNumber: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginRight: 12, flexShrink: 0 },
  stepNumberText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 5 },
  stepInstruction: { fontSize: 13, color: '#555', lineHeight: 19 },
  stepTimerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#FFF3F3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  stepTimerPillText: { fontSize: 11, color: '#8B0000', fontWeight: '600' },
  warningsHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  warningsTitle: { fontSize: 16, fontWeight: '700', color: '#E65100', marginLeft: 8 },
  warningsBox: { backgroundColor: '#FFF8F0', padding: 14, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#E65100' },
  warningItem: { flexDirection: 'row', marginBottom: 10 },
  warningBullet: { fontSize: 14, color: '#E65100', marginRight: 8 },
  warningText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 19 },
  disclaimerBox: { flexDirection: 'row', backgroundColor: '#EEF5FF', padding: 14, borderRadius: 12, marginTop: 20, marginBottom: 20 },
  disclaimerText: { flex: 1, marginLeft: 8, fontSize: 12, color: '#666', lineHeight: 17, fontStyle: 'italic' },
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES — GUIDED MODE
// ─────────────────────────────────────────────────────────────────────────────
const gStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { backgroundColor: '#8B0000', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  closeBtn: { padding: 2 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center', marginHorizontal: 10 },
  stepCounter: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  overallProgressBg: { height: 4, backgroundColor: '#E0E0E0' },
  overallProgressFill: { height: 4, backgroundColor: '#8B0000' },
  scroll: { flex: 1 },
  scrollContent: { padding: 18 },
  dotsRow: { marginBottom: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0E0E0', marginRight: 8 },
  dotActive: { backgroundColor: '#8B0000', width: 24, borderRadius: 5 },
  dotDone: { backgroundColor: '#8B0000', opacity: 0.4 },
  stepCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4, marginBottom: 16 },
  stepBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  stepBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  stepInstruction: { fontSize: 15, color: '#444', lineHeight: 24 },
  timerBox: { backgroundColor: '#fff', borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 3 },
  timerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  timerLabel: { fontSize: 14, fontWeight: '700', color: '#8B0000' },
  timerDisplay: { fontSize: 56, fontWeight: '900', color: '#1A1A1A', textAlign: 'center', marginVertical: 10, fontVariant: ['tabular-nums'] },
  timerBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  timerBarFill: { height: 8, borderRadius: 4 },
  startTimerBtn: { backgroundColor: '#8B0000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  startTimerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  timerDoneBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0FFF4', paddingVertical: 12, borderRadius: 10 },
  timerDoneText: { fontSize: 14, fontWeight: '700', color: '#388E3C' },
  navRow: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#EFEFEF', backgroundColor: '#fff' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: '#8B0000', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  prevBtnText: { fontSize: 14, fontWeight: '700', color: '#8B0000' },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#8B0000', borderRadius: 12, paddingVertical: 14 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// STYLES — SYMPTOM CHECKER
// ─────────────────────────────────────────────────────────────────────────────
const scStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  header: { backgroundColor: '#8B0000', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  instruction: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 14 },
  symptomsGrid: { gap: 8 },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  symptomChipSelected: { backgroundColor: '#8B0000', borderColor: '#8B0000' },
  symptomLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: '#333' },
  symptomLabelSelected: { color: '#fff' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 18 },
  resultsTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  matchIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  matchTitle: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 3 },
  matchDesc: { fontSize: 12, color: '#777', marginBottom: 6 },
  matchMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  matchBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  matchScore: { fontSize: 11, color: '#888' },
  emptyHint: { alignItems: 'center', paddingTop: 50 },
  emptyHintText: { fontSize: 14, color: '#BBB', textAlign: 'center', marginTop: 12, maxWidth: 220 },
  clearBtn: { margin: 16, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0' },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
});