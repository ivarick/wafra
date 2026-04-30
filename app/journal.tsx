import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, CloudRain, Sun, Calendar, Info, Clock, AlertTriangle, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { api } from '@/data/sources/axiosInstance';
import { usePlan } from '@/hooks/usePlan';

const ACTIONS = [
  { id: 'watering', label: 'Watering' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'planting', label: 'Planting' },
  { id: 'harvesting', label: 'Harvesting' },
  { id: 'fertilizing', label: 'Fertilizing' },
  { id: 'observation', label: 'Observation' },
];

const CROPS = ['Tomato', 'Wheat', 'Potato', 'Olive', 'Date Palm', 'Onion', 'Pepper', 'Watermelon', 'Citrus', 'Barley'];

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasFeature } = usePlan();
  const journalEnabled = hasFeature("journalSync");

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedAction, setSelectedAction] = useState('treatment');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!journalEnabled) {
        setLoading(false);
        return;
      }
      fetchJournalData();
    }, [journalEnabled])
  );

  const fetchJournalData = async () => {
    if (!journalEnabled) return;
    setLoading(true);
    try {
      const [logsRes, alertsRes] = await Promise.all([
        api.get('/journal/logs/'),
        api.get('/journal/alerts/')
      ]);

      const fetchedLogs = logsRes.data;
      const fetchedAlerts = alertsRes.data;

      // Merge unread alerts into their respective logs
      const mergedLogs = fetchedLogs.map((log: any) => {
        // Find the first unread alert for this log
        const logAlert = fetchedAlerts.find((a: any) => a.field_log_id === log.id && !a.is_read);
        return {
          ...log,
          alert: logAlert || null
        };
      });

      setLogs(mergedLogs);
    } catch (error) {
      console.error('Failed to load journal data', error);
      Alert.alert('Error', 'Could not load your journal logs.');
    } finally {
      setLoading(false);
    }
  };

  const submitLog = async () => {
    if (!journalEnabled) {
      Alert.alert("Pro feature", "Journal backend sync and weather alerts are available in Pro Farmer.");
      return;
    }
    setSubmitting(true);
    try {
      let lat, lon;
      
      // Try to get location silently to pass to the AI weather engine
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = location.coords.latitude;
        lon = location.coords.longitude;
      }

      const payload = {
        crop: selectedCrop.toLowerCase(), // Backend might prefer lowercase, but any string is fine
        action_type: selectedAction,
        date: new Date().toISOString().split('T')[0],
        notes: notes,
        ...(lat && { lat }),
        ...(lon && { lon })
      };

      const { data } = await api.post('/journal/logs/', payload);

      setModalVisible(false);
      setNotes('');
      
      // Fetch fresh data immediately to see the new log and any generated alerts
      await fetchJournalData();

      // If the backend AI generated alerts, display a popup warning
      if (data.alerts && data.alerts.length > 0) {
        Alert.alert(
          "Proactive Weather Alert ⚠️",
          data.alerts[0],
          [{ text: "Got it" }]
        );
      }

    } catch (error: any) {
      console.error('Failed to create log', error.response?.data || error);
      Alert.alert('Error', 'Failed to save journal entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissAlert = async (alertId: number) => {
    if (!journalEnabled) return;
    try {
      // Optimistically hide the alert
      setLogs(logs.map(log => 
        log.alert?.id === alertId ? { ...log, alert: null } : log
      ));
      
      // Mark as read in backend
      await api.patch(`/journal/alerts/${alertId}/read/`);
    } catch (error) {
      console.error('Failed to dismiss alert', error);
      // We don't necessarily need to revert optimistic UI unless we really want to, it will fix itself on next load
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'watering': return '#3B82F6';
      case 'treatment': return '#EF4444';
      case 'planting': return '#10B981';
      case 'harvesting': return '#F59E0B';
      case 'fertilizing': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Field Journal</Text>
          <Text style={styles.headerSubtitle}>Logs & Weather Alerts</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!journalEnabled ? (
          <View style={styles.lockedCard}>
            <Text style={styles.lockedTitle}>Pro Farmer Feature</Text>
            <Text style={styles.lockedText}>
              Field Journal backend sync, persistence, and weather-triggered alerts are available in Pro Farmer.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push("/pricing")} activeOpacity={0.8}>
              <Text style={styles.upgradeBtnText}>View Plans</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 40 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={40} color={Colors.light.border} />
            <Text style={styles.emptyText}>Your field journal is empty.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logHeaderLeft}>
                  <View style={[styles.actionDot, { backgroundColor: getActionColor(log.action_type) }]} />
                  <Text style={styles.logCrop}>{log.crop.charAt(0).toUpperCase() + log.crop.slice(1)}</Text>
                  <Text style={styles.logAction}>• {log.action_type.charAt(0).toUpperCase() + log.action_type.slice(1)}</Text>
                </View>
                <Text style={styles.logDate}>{log.date}</Text>
              </View>
              
              {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}

              {log.alert && (
                <View style={[styles.alertBox, log.alert.alert_type === 'rain' ? styles.alertRain : styles.alertHeat]}>
                  <AlertTriangle size={16} color={log.alert.alert_type === 'rain' ? '#1E40AF' : '#9A3412'} style={{ marginTop: 2 }} />
                  <Text style={[styles.alertText, log.alert.alert_type === 'rain' ? styles.alertTextRain : styles.alertTextHeat]}>
                    {log.alert.message}
                  </Text>
                  <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismissAlert(log.alert.id)}>
                    <X size={16} color={log.alert.alert_type === 'rain' ? '#1E40AF' : '#9A3412'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.addBtn, !journalEnabled && styles.addBtnDisabled]}
          onPress={() => {
            if (!journalEnabled) {
              Alert.alert("Pro feature", "Journal backend sync and weather alerts are available in Pro Farmer.");
              return;
            }
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Log Intervention</Text>
        </TouchableOpacity>
      </View>

      {/* New Entry Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 20, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Crop</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CROPS.map(crop => (
                <TouchableOpacity 
                  key={crop} 
                  style={[styles.chip, selectedCrop === crop && styles.chipActive]}
                  onPress={() => setSelectedCrop(crop)}
                >
                  <Text style={[styles.chipText, selectedCrop === crop && styles.chipTextActive]}>{crop}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Intervention Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {ACTIONS.map(act => (
                <TouchableOpacity 
                  key={act.id} 
                  style={[styles.chip, selectedAction === act.id && styles.chipActive]}
                  onPress={() => setSelectedAction(act.id)}
                >
                  <Text style={[styles.chipText, selectedAction === act.id && styles.chipTextActive]}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="E.g., Applied 50L/ha of Copper Oxychloride"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitLog} activeOpacity={0.8} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Entry & Analyze Weather</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.light.textSecondary, fontWeight: '500' },
  lockedCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 18,
    marginTop: 8,
  },
  lockedTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  upgradeBtn: {
    marginTop: 14,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  logCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logCrop: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  logAction: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  logDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  logNotes: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 4,
  },
  alertBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  alertRain: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  alertHeat: {
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  alertTextRain: {
    color: '#1E40AF',
  },
  alertTextHeat: {
    color: '#9A3412',
  },
  dismissBtn: {
    padding: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
    marginTop: 16,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    textAlignVertical: 'top',
    height: 100,
  },
  submitBtn: {
    backgroundColor: Colors.light.text,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
