import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function FirstAidScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const firstAidGuides = [
    {
      id: 1,
      title: 'CPR (Cardiopulmonary Resuscitation)',
      category: 'Critical',
      icon: 'heart-pulse',
      urgency: 'critical',
      description: 'Life-saving technique for cardiac arrest',
      steps: [
        {
          step: 1,
          title: 'Check Responsiveness',
          instruction: 'Tap the person and shout "Are you okay?" Check for breathing.',
        },
        {
          step: 2,
          title: 'Call for Help',
          instruction: 'Call emergency services (102) immediately or ask someone else to call.',
        },
        {
          step: 3,
          title: 'Position the Person',
          instruction: 'Lay the person on their back on a firm surface. Kneel beside their chest.',
        },
        {
          step: 4,
          title: 'Hand Placement',
          instruction:
            'Place the heel of one hand on the center of the chest. Place the other hand on top. Interlock fingers.',
        },
        {
          step: 5,
          title: 'Chest Compressions',
          instruction:
            'Push hard and fast in the center of the chest. Compress at least 2 inches deep at a rate of 100-120 compressions per minute.',
        },
        {
          step: 6,
          title: 'Rescue Breaths (if trained)',
          instruction:
            'After 30 compressions, give 2 rescue breaths. Tilt the head back, lift the chin, pinch the nose, and breathe into the mouth.',
        },
        {
          step: 7,
          title: 'Continue CPR',
          instruction: 'Continue cycles of 30 compressions and 2 breaths until help arrives.',
        },
      ],
      warnings: [
        "Don't stop CPR unless the person shows signs of life or medical help arrives",
        'If you are not trained in rescue breaths, perform hands-only CPR (compressions only)',
      ],
    },
    {
      id: 2,
      title: 'Choking',
      category: 'Critical',
      icon: 'alert-circle',
      urgency: 'critical',
      description: 'Emergency procedure for blocked airway',
      steps: [
        {
          step: 1,
          title: 'Identify Choking',
          instruction:
            'Person cannot breathe, speak, or cough effectively. They may clutch their throat.',
        },
        {
          step: 2,
          title: 'Ask Permission',
          instruction: 'Ask "Are you choking?" If yes, tell them you will help.',
        },
        {
          step: 3,
          title: 'Back Blows',
          instruction:
            'Stand behind the person. Lean them forward. Give 5 firm back blows between shoulder blades with the heel of your hand.',
        },
        {
          step: 4,
          title: 'Abdominal Thrusts (Heimlich)',
          instruction:
            'Stand behind the person. Make a fist above the navel. Grasp fist with other hand. Give 5 quick upward thrusts.',
        },
        {
          step: 5,
          title: 'Repeat',
          instruction: 'Alternate 5 back blows and 5 abdominal thrusts until object is dislodged.',
        },
        {
          step: 6,
          title: 'If Unconscious',
          instruction:
            'Lower person to ground carefully. Start CPR immediately. Call emergency services.',
        },
      ],
      warnings: [
        'For pregnant women or obese individuals, give chest thrusts instead of abdominal thrusts',
        'For infants under 1 year, use back blows and chest thrusts, NOT abdominal thrusts',
      ],
    },
    {
      id: 3,
      title: 'Severe Bleeding',
      category: 'Critical',
      icon: 'water',
      urgency: 'critical',
      description: 'Stop life-threatening bleeding',
      steps: [
        {
          step: 1,
          title: 'Safety First',
          instruction: 'Wear gloves if available. Protect yourself from bloodborne pathogens.',
        },
        {
          step: 2,
          title: 'Apply Direct Pressure',
          instruction:
            'Place clean cloth or gauze directly on wound. Press firmly with both hands.',
        },
        {
          step: 3,
          title: 'Maintain Pressure',
          instruction:
            'Keep continuous pressure for at least 10 minutes. Do not lift to check if bleeding stopped.',
        },
        {
          step: 4,
          title: 'Add More Cloth',
          instruction: 'If blood soaks through, add more cloth on top. Do not remove first layer.',
        },
        {
          step: 5,
          title: 'Elevate if Possible',
          instruction:
            'If no broken bones suspected, elevate the injured area above heart level.',
        },
        {
          step: 6,
          title: 'Apply Bandage',
          instruction: 'Once bleeding slows, secure cloth with bandage. Not too tight.',
        },
        {
          step: 7,
          title: 'Seek Medical Help',
          instruction: 'Call ambulance for severe bleeding. Keep person calm and warm.',
        },
      ],
      warnings: [
        'Never apply a tourniquet unless trained and bleeding is life-threatening',
        'Do not remove embedded objects - stabilize them and get medical help',
      ],
    },
    {
      id: 4,
      title: 'Burns',
      category: 'Common',
      icon: 'flame',
      urgency: 'urgent',
      description: 'Treatment for thermal, chemical, or electrical burns',
      steps: [
        {
          step: 1,
          title: 'Stop the Burning',
          instruction:
            'Remove person from source of burn. Extinguish flames if present (stop, drop, roll).',
        },
        {
          step: 2,
          title: 'Cool the Burn',
          instruction:
            'Run cool (not cold) water over burn for 10-20 minutes. Do not use ice.',
        },
        {
          step: 3,
          title: 'Remove Jewelry/Clothing',
          instruction: 'Gently remove jewelry and loose clothing before swelling starts.',
        },
        {
          step: 4,
          title: 'Cover the Burn',
          instruction: 'Cover with sterile, non-stick bandage or clean cloth.',
        },
        {
          step: 5,
          title: 'Pain Relief',
          instruction: 'Give over-the-counter pain reliever if needed (ask about allergies).',
        },
        {
          step: 6,
          title: 'When to Seek Help',
          instruction:
            'Get medical help if burn is larger than 3 inches, on face/hands/feet/genitals, or is deep.',
        },
      ],
      warnings: [
        "Do not apply ice, butter, oil, or ointments to burn",
        "Do not break blisters",
        "For electrical burns, always seek medical attention even if burn seems minor",
      ],
    },
    {
      id: 5,
      title: 'Fractures (Broken Bones)',
      category: 'Common',
      icon: 'bone',
      urgency: 'urgent',
      description: 'Immobilize and stabilize broken bones',
      steps: [
        {
          step: 1,
          title: 'Do Not Move',
          instruction:
            "Keep injured person still. Don't try to realign bone or push bone back in.",
        },
        {
          step: 2,
          title: 'Control Bleeding',
          instruction: 'If bleeding, apply gentle pressure with clean cloth.',
        },
        {
          step: 3,
          title: 'Immobilize',
          instruction:
            'Support injured area with splint or sling. Use rolled newspapers, boards, or pillows.',
        },
        {
          step: 4,
          title: 'Apply Ice',
          instruction: 'Apply ice pack wrapped in cloth to reduce swelling and pain.',
        },
        {
          step: 5,
          title: 'Treat for Shock',
          instruction: 'Have person lie down. Elevate legs if no spine injury suspected.',
        },
        {
          step: 6,
          title: 'Get Medical Help',
          instruction: 'Call ambulance for major fractures or if person cannot move.',
        },
      ],
      warnings: [
        "Don't move person if you suspect spine, neck, or head injury",
        "Don't apply pressure to protruding bone",
      ],
    },
    {
      id: 6,
      title: 'Heart Attack',
      category: 'Critical',
      icon: 'heart',
      urgency: 'critical',
      description: 'Recognize and respond to heart attack symptoms',
      steps: [
        {
          step: 1,
          title: 'Recognize Symptoms',
          instruction:
            'Chest pain/pressure, shortness of breath, pain in arm/jaw/neck, nausea, sweating.',
        },
        {
          step: 2,
          title: 'Call Emergency',
          instruction: 'Call 102 immediately. Do not wait or try to drive to hospital.',
        },
        {
          step: 3,
          title: 'Help Person Rest',
          instruction: 'Have person sit or lie down in comfortable position.',
        },
        {
          step: 4,
          title: 'Loosen Clothing',
          instruction: 'Loosen any tight clothing, especially around neck and chest.',
        },
        {
          step: 5,
          title: 'Give Aspirin (if available)',
          instruction:
            'If person is conscious and not allergic, give 1 aspirin to chew (not swallow whole).',
        },
        {
          step: 6,
          title: 'Monitor & Reassure',
          instruction: 'Stay with person. Monitor breathing. Be ready to perform CPR if needed.',
        },
      ],
      warnings: [
        "Women may have different symptoms: nausea, back pain, extreme fatigue",
        "Never leave person alone",
      ],
    },
    {
      id: 7,
      title: 'Stroke',
      category: 'Critical',
      icon: 'brain',
      urgency: 'critical',
      description: 'Fast action for stroke (F.A.S.T.)',
      steps: [
        {
          step: 1,
          title: 'F - Face Drooping',
          instruction: 'Ask person to smile. Does one side of face droop?',
        },
        {
          step: 2,
          title: 'A - Arm Weakness',
          instruction: 'Ask person to raise both arms. Does one arm drift downward?',
        },
        {
          step: 3,
          title: 'S - Speech Difficulty',
          instruction: 'Ask person to repeat simple phrase. Is speech slurred or strange?',
        },
        {
          step: 4,
          title: 'T - Time to Call 102',
          instruction:
            'If any of above signs present, call emergency immediately. Note time symptoms started.',
        },
        {
          step: 5,
          title: 'Keep Person Comfortable',
          instruction: 'Have person lie down with head slightly elevated.',
        },
        {
          step: 6,
          title: 'Do Not Give Food/Drink',
          instruction: 'Do not let person eat or drink anything.',
        },
      ],
      warnings: [
        "Time is brain - every minute counts",
        "Do not give aspirin for stroke (unlike heart attack)",
      ],
    },
    {
      id: 8,
      title: 'Seizures',
      category: 'Common',
      icon: 'pulse',
      urgency: 'urgent',
      description: 'How to help someone having a seizure',
      steps: [
        {
          step: 1,
          title: 'Stay Calm',
          instruction: 'Most seizures last 1-2 minutes and stop on their own.',
        },
        {
          step: 2,
          title: 'Protect from Injury',
          instruction: 'Move sharp objects away. Cushion head with something soft.',
        },
        {
          step: 3,
          title: 'Turn on Side',
          instruction: 'Gently turn person on their side to keep airway clear.',
        },
        {
          step: 4,
          title: 'Time the Seizure',
          instruction: 'Note how long seizure lasts.',
        },
        {
          step: 5,
          title: 'Stay with Person',
          instruction: 'Stay until person is fully awake and aware.',
        },
        {
          step: 6,
          title: 'When to Call 102',
          instruction:
            'Call if: seizure lasts >5 min, person is injured, pregnant, diabetic, or having first-time seizure.',
        },
      ],
      warnings: [
        "Do NOT put anything in person's mouth",
        "Do NOT restrain person",
        "Do NOT give food/water until fully conscious",
      ],
    },
  ];

  const categories = ['all', 'Critical', 'Common'];

  const filteredGuides = firstAidGuides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openGuide = (guide) => {
    setSelectedGuide(guide);
    setShowGuideModal(true);
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '#FF1744';
      case 'urgent':
        return '#FF9800';
      default:
        return '#4CAF50';
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={20} color="#8B0000" />
        <Text style={styles.infoBannerText}>
          These guides are for reference only. Always call emergency services for serious
          situations.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search emergency situations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryBtnText,
                selectedCategory === cat && styles.categoryBtnTextActive,
              ]}
            >
              {cat === 'all' ? 'All' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Guides List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredGuides.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            onPress={() => openGuide(guide)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getUrgencyColor(guide.urgency) + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name={guide.icon}
                size={32}
                color={getUrgencyColor(guide.urgency)}
              />
            </View>

            <View style={styles.guideInfo}>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideDescription}>{guide.description}</Text>
              <View style={styles.guideMeta}>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: getUrgencyColor(guide.urgency) },
                  ]}
                >
                  <Text style={styles.urgencyText}>{guide.category}</Text>
                </View>
                <Text style={styles.stepsCount}>{guide.steps.length} steps</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}

        {filteredGuides.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-open-outline" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No guides found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Guide Detail Modal */}
      <Modal
        visible={showGuideModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowGuideModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGuideModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedGuide?.title}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedGuide && (
              <>
                {/* Emergency Banner */}
                {selectedGuide.urgency === 'critical' && (
                  <View style={styles.emergencyCallBanner}>
                    <MaterialCommunityIcons name="alert" size={24} color="#fff" />
                    <Text style={styles.emergencyCallText}>
                      Call 102 immediately for this emergency!
                    </Text>
                  </View>
                )}

                {/* Description */}
                <Text style={styles.modalDescription}>{selectedGuide.description}</Text>

                {/* Steps */}
                <Text style={styles.sectionTitle}>Step-by-Step Instructions</Text>
                {selectedGuide.steps.map((step, index) => (
                  <View key={index} style={styles.stepCard}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.step}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    </View>
                  </View>
                ))}

                {/* Warnings */}
                {selectedGuide.warnings && selectedGuide.warnings.length > 0 && (
                  <>
                    <View style={styles.warningsHeader}>
                      <MaterialCommunityIcons name="alert-circle" size={24} color="#FF9800" />
                      <Text style={styles.warningsTitle}>Important Warnings</Text>
                    </View>
                    <View style={styles.warningsBox}>
                      {selectedGuide.warnings.map((warning, index) => (
                        <View key={index} style={styles.warningItem}>
                          <Text style={styles.warningBullet}>•</Text>
                          <Text style={styles.warningText}>{warning}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.disclaimerBox}>
                  <MaterialCommunityIcons name="information" size={20} color="#666" />
                  <Text style={styles.disclaimerText}>
                    This guide is for informational purposes only. Always seek professional medical
                    help in emergencies.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  infoBanner: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  categoryBtnActive: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryBtnTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  guideCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  guideMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urgencyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  stepsCount: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 6,
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  emergencyCallBanner: {
    backgroundColor: '#FF1744',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  emergencyCallText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  stepInstruction: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  warningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 8,
  },
  warningsBox: {
    backgroundColor: '#FFF9E5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  warningBullet: {
    fontSize: 16,
    color: '#FF9800',
    marginRight: 8,
    fontWeight: 'bold',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});