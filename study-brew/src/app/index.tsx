import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ActivityIndicator, Animated, Alert, Modal } from 'react-native';
import MapView from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function StudyBrewApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  // Νέα states για το Profile
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [profileData, setProfileData] = useState({ studies: 'Select', level: 'Select', style: 'Select' });
  const [interests, setInterests] = useState(['TECH', 'SELECT', 'SELECT']);

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    setIsLoggedIn(true);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow camera access!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      Alert.alert("Success!", "Photo captured for Study Brew!");
    }
  };

  // 1. SPLASH
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image source={require('../assets/images/logo.png')} style={styles.mainLogo} resizeMode="contain" />
        </Animated.View>
        <ActivityIndicator size="large" color="#4E342E" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // 2. LOGIN
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.smallLogo} resizeMode="contain" />
        <View style={styles.inputArea}>
          <Text style={styles.welcomeText}>Welcome back, Scholar.</Text>
          <TextInput style={styles.input} placeholder="University Email" placeholderTextColor="#A1887F" />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry placeholderTextColor="#A1887F" />
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. PROFILE SCREEN
  if (!isProfileComplete) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.welcomeText}>Brew your profile!</Text>
        
        <Text style={styles.label}>Studies:</Text>
        <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('studies'); setIsModalVisible(true); }}>
          <Text>{profileData.studies}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Level:</Text>
        <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('level'); setIsModalVisible(true); }}>
          <Text>{profileData.level}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Interests:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          {interests.map((i, idx) => (
            <TouchableOpacity key={idx} style={styles.interestBtn}>
              <Text style={{fontSize: 10}}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Study style:</Text>
        <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('style'); setIsModalVisible(true); }}>
          <Text>{profileData.style}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={() => setIsProfileComplete(true)}>
          <Text style={styles.loginBtnText}>next</Text>
        </TouchableOpacity>

        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {['Undergraduate', 'Postgraduate', 'PhD', 'Research'].map((item) => (
                <TouchableOpacity key={item} onPress={() => {
                  setProfileData({...profileData, [currentField]: item});
                  setIsModalVisible(false);
                }}>
                  <Text style={styles.modalItem}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 4. MAIN SCREEN
  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert("Settings", "Account settings coming soon!")}>
          <Text style={styles.headerText}>⚙️ Settings</Text>
        </TouchableOpacity>
        <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
      </View>

      <MapView 
        style={styles.map} 
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: location?.coords.latitude || 37.9838,
          longitude: location?.coords.longitude || 23.7275,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        }} 
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => Alert.alert("Cafes", "Finding nearby study spots...")}>
          <Text style={styles.navIcon}>☕</Text>
          <Text style={styles.navLabel}>Cafes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={openCamera}>
          <Text style={styles.navIcon}>📷</Text>
          <Text style={styles.navLabel}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => Alert.alert("Study AI", "How can I help you study today?")}>
          <Text style={styles.navIcon}>🤖</Text>
          <Text style={styles.navLabel}>AI Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#C8A276', justifyContent: 'center', alignItems: 'center' },
  mainLogo: { width: 300, height: 150 },
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, alignItems: 'center', backgroundColor: '#FAF3E0' },
  headerText: { fontSize: 16, fontWeight: '600', color: '#4E342E' },
  profilePic: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#4E342E' },
  map: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  navBtn: { alignItems: 'center' },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 12, color: '#4E342E', fontWeight: '500' },
  loginContainer: { flex: 1, backgroundColor: '#FAF3E0', padding: 30, justifyContent: 'center' },
  smallLogo: { width: 200, height: 100, alignSelf: 'center', marginBottom: 20 },
  inputArea: { width: '100%' },
  welcomeText: { fontSize: 20, fontWeight: '700', color: '#4E342E', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#D7CCC8' },
  loginBtn: { backgroundColor: '#4E342E', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#4E342E', marginBottom: 5 },
  interestBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#D7CCC8', width: '30%', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 10 },
  modalItem: { padding: 15, fontSize: 18, borderBottomWidth: 1, borderColor: '#EEE' },
});