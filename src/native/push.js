// Push is opt-in: permission is requested only from the Privacy tab toggle.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function registerForPush() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('conditions', { name: 'Conditions', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const cur = await Notifications.getPermissionsAsync();
    let status = cur.status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId || String(projectId).startsWith('[')) return { ok: false, reason: 'no-project-id' };
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    // TODO: send `token` to your backend (needs a server to send pushes).
    return { ok: true, token };
  } catch (e) {
    console.warn('push registration failed', e?.message);
    return { ok: false, reason: 'error' };
  }
}
