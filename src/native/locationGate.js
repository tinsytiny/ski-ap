// Foreground location, only requested when the user taps to post.
// Coordinates are used for the 5 km check and NOT stored.
import * as Location from 'expo-location';

export async function getPostingPosition() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { permission: 'denied', position: null };
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      permission: 'granted',
      position: { lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy ?? undefined, timestamp: p.timestamp, mocked: p.mocked === true },
    };
  } catch (e) {
    console.warn('location failed', e?.message);
    return { permission: 'granted', position: null }; // fails closed as NO_FIX
  }
}
