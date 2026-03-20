import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { apiConfig } from '../config/api';

// ─── Helper: turn a relative image path into a full URL ──────────────────────
// The backend stores paths like "/uploads/events/event-123.jpg".
// We strip "/api" from BASE_URL to get the server root, then prepend it.
// Absolute URLs (http/https) are returned unchanged.
const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Strip trailing /api or /api/ from BASE_URL to get the server root
  const serverRoot = apiConfig.BASE_URL.replace(/\/api\/?$/, '');
  if (url.startsWith('/')) return `${serverRoot}${url}`;
  return `${serverRoot}/${url}`;
};

export default function DonationScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    // Refresh list every time the screen comes into focus so a newly created
    // campaign (with or without an image) appears immediately.
    const unsub = navigation.addListener('focus', fetchCampaigns);
    return unsub;
  }, [navigation]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${apiConfig.BASE_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setCampaigns(data.data || []);
    } catch (e) {
      console.error('[Donation] Error fetching campaigns:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const progress = (raised, target) =>
    Math.min(((raised || 0) / (target || 1)) * 100, 100);

  const daysLeft = (deadline) => {
    const d = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return d > 0 ? `${d} days left` : 'Deadline passed';
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B0000" />
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Campaign</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateCampaign')}
        >
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Info banner ── */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information" size={18} color="#8B0000" />
        <Text style={styles.infoBannerText}>
          100% of donations go directly to medical expenses. Tap the + to
          create a campaign.
        </Text>
      </View>

      {/* ── Campaign list ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B0000']}
            tintColor="#8B0000"
          />
        }
      >
        {campaigns.length === 0 ? (
          /* ── Empty state ── */
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No Campaigns Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to create a fundraising campaign for someone in need.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CreateCampaign')}
            >
              <Text style={styles.emptyBtnText}>Create Campaign</Text>
            </TouchableOpacity>
          </View>
        ) : (
          campaigns.map((c) => {
            const pct = progress(c.raised_amount, c.target_amount);

            // ── Resolve the image URL ──────────────────────────────────────
            // getFullImageUrl handles: null, relative paths, absolute URLs.
            const resolvedImageUrl = getFullImageUrl(c.image_url);

            return (
              <View key={c.campaign_id} style={styles.card}>

                {/* ── Campaign image (or coloured placeholder) ── */}
                {resolvedImageUrl ? (
                  <Image
                    source={{ uri: resolvedImageUrl }}
                    style={styles.cardImage}
                    // onError keeps the UI clean if the file is missing on server
                    onError={(e) =>
                      console.warn(
                        '[Donation] Image load error:',
                        resolvedImageUrl,
                        e.nativeEvent.error
                      )
                    }
                  />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="heart" size={40} color="#8B000030" />
                    <Text style={styles.noImageText}>No photo added</Text>
                  </View>
                )}

                {/* ── Verified badge (shown on top of image) ── */}
                {c.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={15} color="#fff" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}

                {/* ── Card body ── */}
                <View style={styles.cardBody}>

                  {/* Tags row */}
                  <View style={styles.tagsRow}>
                    <View style={styles.urgentTag}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                    <Text style={styles.daysLeft}>{daysLeft(c.deadline)}</Text>
                  </View>

                  {/* Patient info */}
                  <Text style={styles.patientName}>{c.patient_name}</Text>
                  <Text style={styles.condition}>{c.condition}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="medical" size={14} color="#888" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {c.hospital_name}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={14} color="#888" />
                    <Text style={styles.infoText}>{c.city}</Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${pct}%` }]}
                    />
                  </View>

                  {/* Amount row */}
                  <View style={styles.amtRow}>
                    <View>
                      <Text style={styles.raisedAmt}>
                        Rs. {(c.raised_amount || 0).toLocaleString()}
                      </Text>
                      <Text style={styles.raisedLabel}>raised</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.targetAmt}>
                        Rs. {(c.target_amount || 0).toLocaleString()}
                      </Text>
                      <Text style={styles.targetLabel}>goal</Text>
                    </View>
                  </View>

                  {/* Story preview */}
                  <Text style={styles.story} numberOfLines={2}>
                    {c.story}
                  </Text>

                  {/* Action buttons */}
                  <View style={styles.btns}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() =>
                        navigation.navigate('CampaignDetails', { campaign: c })
                      }
                    >
                      <Text style={styles.detailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.donateBtn}
                      onPress={() =>
                        navigation.navigate('CampaignDetails', { campaign: c })
                      }
                    >
                      <MaterialCommunityIcons
                        name="hand-coin"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.donateBtnText}>Donate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },

  // Header
  header: {
    backgroundColor: '#8B0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  addBtn: { padding: 4 },

  // Info banner
  infoBanner: {
    backgroundColor: '#FFF9E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },

  // Scroll
  scroll: { flex: 1, paddingTop: 12 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Campaign card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // ── Image area ─────────────────────────────────────────────────────────────
  cardImage: {
    width: '100%',
    height: 200,          // slightly taller than before so photos look better
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#fce4e4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 13,
    color: '#c08080',
    fontWeight: '500',
  },
  // ── End image area ─────────────────────────────────────────────────────────

  // Verified badge (overlaid on image)
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: { color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 3 },

  // Card body
  cardBody: { padding: 16 },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  urgentTag: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
  },
  urgentText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  daysLeft: { fontSize: 12, color: '#8B0000', fontWeight: '600' },

  patientName: { fontSize: 19, fontWeight: 'bold', color: '#222', marginBottom: 3 },
  condition: { fontSize: 14, color: '#8B0000', fontWeight: '600', marginBottom: 10 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#777', marginLeft: 5, flex: 1 },

  // Progress
  progressBar: {
    height: 7,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },

  // Amounts
  amtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  raisedAmt: { fontSize: 17, fontWeight: 'bold', color: '#4CAF50' },
  raisedLabel: { fontSize: 11, color: '#aaa', marginTop: 1 },
  targetAmt: { fontSize: 14, fontWeight: '600', color: '#888' },
  targetLabel: { fontSize: 11, color: '#aaa', marginTop: 1 },

  // Story
  story: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 14 },

  // Action buttons
  btns: { flexDirection: 'row', gap: 10 },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detailsBtnText: { color: '#444', fontSize: 14, fontWeight: '600' },
  donateBtn: {
    flex: 1,
    backgroundColor: '#8B0000',
    paddingVertical: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  donateBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});