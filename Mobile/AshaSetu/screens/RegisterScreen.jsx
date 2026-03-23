// RegisterScreen_Dark_to_Light.jsx — Converted to White & Red Theme (Glitch Fixed)

import React, { useState, useContext, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../context/AuthContext';
import { registerUser } from '../api/auth';

const REQUIRED_FIELDS = ['full_name', 'email', 'city', 'phone_number', 'password', 'confirm_password'];
const POUCH_HEIGHT = 120;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'
];

const CITIES_BY_PROVINCE = {
  Koshi: ['Biratnagar', 'Dharan', 'Itahari', 'Damak', 'Birtamod', 'Ilam', 'Taplejung', 'Phidim', 'Dhankuta', 'Hile', 'Terhathum', 'Myanglung', 'Khandbari', 'Chainpur', 'Tumlingtar', 'Bhojpur', 'Diktel', 'Solukhumbu', 'Salleri', 'Okhaldhunga'],
  Madhesh: ['Janakpur', 'Birgunj', 'Rajbiraj', 'Lahan', 'Siraha', 'Jaleshwar', 'Gaur', 'Malangwa', 'Bardibas', 'Mirchaiya', 'Dhalkebar', 'Kalaiya', 'Parwanipur', 'Simraungadh', 'Matihani', 'Sabhapur', 'Aurahi', 'Surunga'],
  Bagmati: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Hetauda', 'Bharatpur', 'Bidur', 'Dhulikhel', 'Banepa', 'Panauti', 'Sindhuli', 'Ramechhap', 'Manthali', 'Charikot', 'Dolakha', 'Jiri', 'Nuwakot', 'Trisuli', 'Rasuwa', 'Dhunche', 'Makwanpur'],
  Gandaki: ['Pokhara', 'Damauli', 'Baglung', 'Gorkha', 'Besisahar', 'Chame', 'Manang', 'Mustang', 'Jomsom', 'Myagdi', 'Beni', 'Parbat', 'Kushma', 'Syangja', 'Waling', 'Kaski', 'Lamjung', 'Tanahu', 'Nawalpur', 'Kawasoti'],
  Lumbini: ['Butwal', 'Bhairahawa', 'Tansen', 'Tulsipur', 'Dang', 'Ghorahi', 'Kapilvastu', 'Taulihawa', 'Arghakhanchi', 'Sandhikharka', 'Gulmi', 'Tamghas', 'Palpa', 'Rolpa', 'Liwang', 'Rukum', 'Musikot', 'Pyuthan', 'Nawalparasi', 'Bardaghat'],
  Karnali: ['Birendranagar', 'Jumla', 'Dailekh', 'Narayan', 'Dolpa', 'Dunai', 'Humla', 'Simikot', 'Jajarkot', 'Khalanga', 'Kalikot', 'Manma', 'Mugu', 'Gamgadhi', 'Salyan', 'Sharada', 'Surkhet', 'Rukum West', 'Achham', 'Sanfebagar'],
  Sudurpashchim: ['Dhangadhi', 'Mahendranagar', 'Dadeldhura', 'Baitadi', 'Darchula', 'Bajhang', 'Chainpur', 'Bajura', 'Martadi', 'Accham', 'Mangalsen', 'Doti', 'Dipayal', 'Kanchanpur', 'Bhimdatta', 'Seti', 'Godawari', 'Punarbas', 'Bedkot', 'Shuklaphanta'],
};

// ─── Isolated field — typing only re-renders THIS component ──────────────────
const FormField = memo(({ fieldKey, label, placeholder, keyboardType,
  secure, hint, maxLength, autoCapitalize, value, onChangeText, scrollRef, fieldOffsets  }) => {

  const [isFocused, setIsFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const hasValue = value?.length > 0;

  const handleLayout = useCallback((e) => {

    // Store the y-offset of this field so we can scroll to it on focus

    fieldOffsets.current[fieldKey] = e.nativeEvent.layout.y;

  }, [fieldKey, fieldOffsets]);


  const handleFocus = useCallback(() => {

    setIsFocused(true);

    const y = fieldOffsets.current[fieldKey] ?? 0;

    // Slight delay lets the keyboard start appearing before we scroll,

    // so we land at the right position after layout settles

    setTimeout(() => {

      scrollRef.current?.scrollTo({ y, animated: true });

    }, 120);

  }, [fieldKey, fieldOffsets, scrollRef]);

  return (
      <View style={styles.fieldGroup} onLayout={handleLayout}>      
        <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, isFocused && styles.fieldLabelFocused]}>{label}</Text>
        {hasValue && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={[
        styles.inputBox,
        isFocused && styles.inputBoxFocused,
        hasValue && !isFocused && styles.inputBoxFilled,
      ]}>
        <View style={[styles.accentBar, { backgroundColor: hasValue ? '#8B0000' : '#f0dede' }]} />
        <TextInput
          style={[styles.textInput, secure && { paddingRight: 44 }]}
          placeholder={placeholder}
          placeholderTextColor="#bbb"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secure && !showPass}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          maxLength={maxLength}
          returnKeyType={secure ? 'done' : 'next'}
          onSubmitEditing={secure ? () => Keyboard.dismiss() : undefined}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPass ? '👁' : '🔒'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

// ─── Isolated pouch — only re-renders when filledCount changes ────────────────
const BloodPouch = memo(({ filledCount, isComplete, fillAnim, pulseAnim }) => {
  const pouchFillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, POUCH_HEIGHT],
  });

  return (
    <View style={styles.pouchSection}>
      {/* Left info — plain View */}
      <View style={styles.pouchInfo}>
        <Text style={styles.pouchMainText}>
          {isComplete ? '🩸 Ready!' : 'One Step Closer'}
        </Text>
        {!isComplete && <Text style={styles.pouchSubText}>to Saving a Life</Text>}
        <Text style={styles.pouchCount}>{filledCount} / {REQUIRED_FIELDS.length} required</Text>
        <View style={styles.dotsRow}>
          {REQUIRED_FIELDS.map((_, i) => (
            <View key={i} style={[styles.dot, i < filledCount && styles.dotFilled]} />
          ))}
        </View>
        {isComplete && <Text style={styles.pouchComplete}>Register below ↓</Text>}
      </View>

      {/* Right pouch — scale ONLY on this Animated.View */}
      <Animated.View style={[styles.pouchRight, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.pouchWrap}>
          <View style={styles.pouchHook} />
          <View style={styles.pouchBody}>
            <Animated.View style={[styles.pouchFill, { height: pouchFillHeight }]} />
            <View style={styles.pouchGloss} />
            <View style={styles.pouchLabelBadge}>
              <Text style={styles.pouchLabelText}>A+</Text>
            </View>
            <View style={[styles.pouchTick, { bottom: POUCH_HEIGHT * 0.75 }]} />
            <View style={[styles.pouchTick, { bottom: POUCH_HEIGHT * 0.5 }]} />
            <View style={[styles.pouchTick, { bottom: POUCH_HEIGHT * 0.25 }]} />
          </View>
          <View style={styles.tubeSegment} />
          <View style={styles.tubeCap} />
        </View>
      </Animated.View>
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const RegisterScreen_Dark = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  const fieldOffsets = useRef({});

  const [formData, setFormData] = useState({
    full_name: '', email: '', city: '',
    phone_number: '', blood_type: '', province: '', password: '', confirm_password: '',
  });
  const [selectedProvince, setSelectedProvince] = useState('');
  const [loading, setLoading] = useState(false);
  const [filledCount, setFilledCount] = useState(0);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef(null);
  const prevFilledCount = useRef(0);

  // Ambient glow — runs once
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Pouch animation — only fires when filledCount changes
  useEffect(() => {
    if (prevFilledCount.current === filledCount) return;
    prevFilledCount.current = filledCount;

    const progress = filledCount / REQUIRED_FIELDS.length;
    Animated.spring(fillAnim, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();

    if (filledCount === REQUIRED_FIELDS.length) {
      pulseLoop.current?.stop();
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseLoop.current = null;
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [filledCount]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      const count = REQUIRED_FIELDS.filter(f => next[f]?.trim().length > 0).length;
      setFilledCount(count);
      return next;
    });
  }, []);

  const handleRegister = async () => {
    if (!formData.full_name || !formData.email || !formData.city || !formData.phone_number || !formData.password || !formData.confirm_password) {
      Alert.alert('Required Fields Missing', 'Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!/^98\d{8}$/.test(formData.phone_number)) {
      Alert.alert('Invalid Phone', 'Phone must start with 98 and be 10 digits.');
      return;
    }
    if (formData.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { province, confirm_password, ...registerData } = formData;
      const response = await registerUser(registerData);
      if (response.success) await login(response.token, response.user);
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = filledCount === REQUIRED_FIELDS.length;
  const ambientOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerGlow, { opacity: ambientOpacity }]} />
          <View style={styles.headerCircle} />
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join AshaSetu · Save Lives</Text>
        </View>

        {/* Blood Pouch */}
        <BloodPouch
          filledCount={filledCount}
          isComplete={isComplete}
          fillAnim={fillAnim}
          pulseAnim={pulseAnim}
        />

        {/* Form */}
        <View style={styles.form}>
          <FormField fieldKey="full_name" label="Full Name *" placeholder="Your full name" autoCapitalize="words" value={formData.full_name} onChangeText={v => updateField('full_name', v)} scrollRef={scrollViewRef} fieldOffsets={fieldOffsets} />
          <FormField fieldKey="email" label="Email Address *" placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={v => updateField('email', v)} scrollRef={scrollViewRef} fieldOffsets={fieldOffsets} />
          <FormField fieldKey="phone_number" label="Phone Number *" placeholder="98XXXXXXXX" keyboardType="phone-pad" hint="Must start with 98 · 10 digits total" maxLength={10} value={formData.phone_number} onChangeText={v => updateField('phone_number', v)} scrollRef={scrollViewRef} fieldOffsets={fieldOffsets} />
          <View style={styles.fieldGroup} onLayout={(e) => fieldOffsets.current['blood_type'] = e.nativeEvent.layout.y}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, formData.blood_type && styles.fieldLabelFocused]}>Blood Type (Optional)</Text>
              {formData.blood_type && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={[styles.inputBox, formData.blood_type && styles.inputBoxFilled]}>
              <View style={[styles.accentBar, { backgroundColor: formData.blood_type ? '#8B0000' : '#f0dede' }]} />
              <Picker
                selectedValue={formData.blood_type}
                onValueChange={(itemValue) => updateField('blood_type', itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Blood Type" value="" />
                {BLOOD_TYPES.map(type => <Picker.Item key={type} label={type} value={type} />)}
              </Picker>
            </View>
          </View>
          <View style={styles.fieldGroup} onLayout={(e) => fieldOffsets.current['province'] = e.nativeEvent.layout.y}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, formData.province && styles.fieldLabelFocused]}>Province (Optional)</Text>
              {formData.province && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={[styles.inputBox, formData.province && styles.inputBoxFilled]}>
              <View style={[styles.accentBar, { backgroundColor: formData.province ? '#8B0000' : '#f0dede' }]} />
              <Picker
                selectedValue={formData.province}
                onValueChange={(itemValue) => {
                  if (itemValue !== selectedProvince) {
                    updateField('city', '');
                  }
                  setSelectedProvince(itemValue);
                  updateField('province', itemValue);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select Province" value="" />
                {PROVINCES.map(prov => <Picker.Item key={prov} label={prov} value={prov} />)}
              </Picker>
            </View>
          </View>
          <View style={styles.fieldGroup} onLayout={(e) => fieldOffsets.current['city'] = e.nativeEvent.layout.y}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, formData.city && styles.fieldLabelFocused]}>City *</Text>
              {formData.city && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={[styles.inputBox, formData.city && styles.inputBoxFilled]}>
              <View style={[styles.accentBar, { backgroundColor: formData.city ? '#8B0000' : '#f0dede' }]} />
              <Picker
                selectedValue={formData.city}
                onValueChange={(itemValue) => updateField('city', itemValue)}
                style={styles.picker}
                enabled={!!selectedProvince}
              >
                <Picker.Item label={selectedProvince ? "Select City" : "Select Province First"} value="" />
                {selectedProvince && CITIES_BY_PROVINCE[selectedProvince]?.map(city => <Picker.Item key={city} label={city} value={city} />)}
              </Picker>
            </View>
          </View>
          <FormField fieldKey="password" label="Password *" placeholder="Min. 6 characters" secure hint="At least 6 characters" autoCapitalize="none" value={formData.password} onChangeText={v => updateField('password', v)} scrollRef={scrollViewRef} fieldOffsets={fieldOffsets} />
          <FormField fieldKey="confirm_password" label="Confirm Password *" placeholder="Re-enter password" secure hint="Must match password" autoCapitalize="none" value={formData.confirm_password} onChangeText={v => updateField('confirm_password', v)} scrollRef={scrollViewRef} fieldOffsets={fieldOffsets} />

          <View style={styles.terms}>
            <View style={styles.termsDivider} />
            <Text style={styles.termsText}>
              By registering, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.regBtn, loading && styles.regBtnDisabled, isComplete && styles.regBtnReady]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.regBtnText}>
                {isComplete ? '🩸 Create My Account' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },

  // Header — red bg, white text (same structure, new colors)
  header: {
    backgroundColor: '#8B0000',
    paddingTop: 50, paddingBottom: 36, paddingHorizontal: 28,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  headerGlow: {
    position: 'absolute', top: -20, right: -20,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#fff',
  },
  headerCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 6 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500', letterSpacing: 0.3 },

  // Pouch card — white bg, red accents
  pouchSection: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    marginHorizontal: 20, marginTop: 20,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(139,0,0,0.12)',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
    alignItems: 'center',
  },
  pouchInfo: { flex: 1, paddingRight: 16 },
  pouchMainText: { fontSize: 15, fontWeight: '800', color: '#8B0000', marginBottom: 2 },
  pouchSubText: { fontSize: 13, color: '#8B0000', opacity: 0.65, marginBottom: 8 },
  pouchCount: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  dotsRow: { flexDirection: 'row', gap: 7 },
  dot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#f0dede', borderWidth: 1, borderColor: '#e0c0c0',
  },
  dotFilled: {
    backgroundColor: '#8B0000', borderColor: '#cc0000',
  },
  pouchComplete: { marginTop: 10, fontSize: 12, color: '#8B0000', fontWeight: '700' },

  pouchRight: { alignItems: 'center' },
  pouchWrap: { alignItems: 'center' },
  pouchHook: {
    width: 26, height: 14,
    borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3,
    borderColor: '#8B0000',
    borderTopLeftRadius: 13, borderTopRightRadius: 13,
    borderBottomWidth: 0,
  },
  pouchBody: {
    width: 68, height: POUCH_HEIGHT,
    borderRadius: 16, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    backgroundColor: 'rgba(255,220,220,0.5)',
    borderWidth: 2, borderColor: 'rgba(139,0,0,0.25)',
    overflow: 'hidden', position: 'relative',
  },
  pouchFill: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#cc0000',
  },
  pouchGloss: {
    position: 'absolute', top: 8, left: 8,
    width: 10, bottom: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 5, zIndex: 2,
  },
  pouchLabelBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(139,0,0,0.12)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, zIndex: 3,
  },
  pouchLabelText: { fontSize: 11, fontWeight: '800', color: '#8B0000' },
  pouchTick: {
    position: 'absolute', left: 4, right: 4,
    height: 1, backgroundColor: 'rgba(139,0,0,0.2)', zIndex: 2,
  },
  tubeSegment: {
    width: 5, height: 20,
    backgroundColor: 'rgba(139,0,0,0.35)', borderRadius: 3,
  },
  tubeCap: { width: 10, height: 6, backgroundColor: '#8B0000', borderRadius: 3 },

  // Form
  form: { paddingHorizontal: 20, paddingTop: 24 },
  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1.2, textTransform: 'uppercase' },
  fieldLabelFocused: { color: '#8B0000' },
  checkmark: { fontSize: 13, color: '#8B0000', fontWeight: '800' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fafafa', borderWidth: 1.5, borderColor: '#eee',
    borderRadius: 12, overflow: 'hidden', height: 52,
  },
  inputBoxFocused: {
    borderColor: '#8B0000', backgroundColor: '#fff9f9',
    shadowColor: '#8B0000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  inputBoxFilled: { borderColor: 'rgba(139,0,0,0.2)', backgroundColor: '#fff' },
  accentBar: { width: 4, alignSelf: 'stretch' },
  textInput: {
    flex: 1, fontSize: 15, color: '#1a1a1a',
    paddingHorizontal: 12, paddingVertical: 15,
  },
  picker: {
    flex: 1, fontSize: 15, color: '#1a1a1a',
    paddingHorizontal: 12, paddingVertical: 15,
  },
  eyeBtn: { position: 'absolute', right: 12, padding: 4 },
  eyeIcon: { fontSize: 16 },
  hint: { fontSize: 11, color: '#bbb', marginTop: 5, paddingLeft: 4, fontStyle: 'italic' },

  terms: { marginTop: 12, marginBottom: 24, alignItems: 'center' },
  termsDivider: { width: 40, height: 1, backgroundColor: '#eee', marginBottom: 12 },
  termsText: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },

  regBtn: {
    backgroundColor: '#8B0000', borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B0000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  regBtnReady: {
    backgroundColor: '#cc0000',
    shadowColor: '#ff0000', shadowOpacity: 0.45, shadowRadius: 18, elevation: 12,
  },
  regBtnDisabled: { backgroundColor: '#ddd', shadowOpacity: 0 },
  regBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.8 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  loginText: { fontSize: 14, color: '#999' },
  loginLink: { fontSize: 14, color: '#8B0000', fontWeight: '700' },
});

export default RegisterScreen_Dark;