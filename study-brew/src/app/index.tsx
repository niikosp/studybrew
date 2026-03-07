import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ActivityIndicator, Animated, Alert, Modal, ScrollView } from 'react-native';
import MapView from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Αρχικοποίηση AI
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

export default function StudyBrewApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0); 
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'bot', text: 'Γεια! Πώς μπορώ να βοηθήσω στο διάβασμα;' }]);
  const [inputText, setInputText] = useState('');
  const [currentField, setCurrentField] = useState('');
  const [profileData, setProfileData] = useState({ studies: 'Select', level: 'Select', style: 'Select', detail: '' });
  const [interests, setInterests] = useState(['TECH', 'BUSINESS', 'ART']);
  
  // Προσθήκη για διατήρηση ιστορικού συνομιλίας
  const [chatSession, setChatSession] = useState<any>(null);

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const timer = setTimeout(() => setIsLoading(false), 3000);
    
    // Αρχικοποίηση του chat session
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    setChatSession(model.startChat({ history: [] }));
    
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '' || !chatSession) return;
    
    const newMessages = [...chatMessages, { role: 'user', text: inputText }];
    setChatMessages(newMessages);
    setInputText('');
    setIsThinking(true);
    
    try {
      // Αποστολή μηνύματος στο session
      const result = await chatSession.sendMessage(inputText);
      const responseText = await result.response.text();
      setChatMessages([...newMessages, { role: 'bot', text: responseText }]);
    } catch (e) {
      setChatMessages([...newMessages, { role: 'bot', text: "Σφάλμα σύνδεσης." }]);
    } finally {
      setIsThinking(false);
    }
  };

  // ... (διατηρείται όλο το υπόλοιπο UI και οι συναρτήσεις σας όπως τις είχατε) ...

  const handleLogin = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    setIsLoggedIn(true);
    setOnboardingStep(1);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) { Alert.alert("Permission Required"); return; }
    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) Alert.alert("Success!", "Photo captured!");
  };

  const levelOptions = ['Λύκειο', 'Προπτυχιακός', 'Μεταπτυχιακός', 'Διδακτορικός'];
  const directionOptions = ['Ανθρωπιστικών Σπουδών', 'Θετικών Σπουδών', 'Σπουδών Υγείας', 'Σπουδών Οικονομίας & Πληροφορικής'];
  const universityOptions = ['ΕΚΠΑ', 'ΕΜΠ', 'ΟΠΑ', 'ΠΑΠΕΙ', 'ΑΠΘ', 'Πανεπιστήμιο Πατρών', 'Πανεπιστήμιο Ιωαννίνων', 'Πανεπιστήμιο Κρήτης', 'Πανεπιστήμιο Αιγαίου', 'Άλλο'];

  const getOptions = () => {
    if (currentField === 'level') return levelOptions;
    if (currentField === 'studies') return profileData.level === 'Λύκειο' ? directionOptions : universityOptions;
    return ['Hybrid', 'Silent', 'Group Study', 'Café Vibes'];
  };

  // Render ...
  if (isLoading) return (
    <View style={styles.splashContainer}>
      <Animated.View style={{ opacity: fadeAnim }}><Image source={require('../assets/images/logo.png')} style={styles.mainLogo} resizeMode="contain" /></Animated.View>
      <ActivityIndicator size="large" color="#4E342E" style={{ marginTop: 20 }} />
    </View>
  );

  if (onboardingStep === 0) return (
    <View style={styles.loginContainer}>
      <Image source={require('../assets/images/logo.png')} style={styles.smallLogo} resizeMode="contain" />
      <View style={styles.inputArea}>
        <Text style={styles.welcomeText}>Welcome back, Scholar.</Text>
        <TextInput style={styles.input} placeholder="University Email" placeholderTextColor="#A1887F" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry placeholderTextColor="#A1887F" />
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}><Text style={styles.loginBtnText}>Sign In</Text></TouchableOpacity>
      </View>
    </View>
  );

  if (onboardingStep === 1) return (
    <View style={styles.loginContainer}>
      <Text style={styles.welcomeText}>Brew your profile!</Text>
      <Text style={styles.label}>Level:</Text>
      <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('level'); setIsModalVisible(true); }}><Text>{profileData.level}</Text></TouchableOpacity>
      <Text style={styles.label}>{profileData.level === 'Λύκειο' ? 'Studies:' : 'University:'}</Text>
      <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('studies'); setIsModalVisible(true); }}><Text>{profileData.studies}</Text></TouchableOpacity>
      <Text style={styles.label}>Interests:</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
        {interests.map((i, idx) => (<TouchableOpacity key={idx} style={styles.interestBtn}><Text style={{fontSize: 10, fontWeight: 'bold'}}>{i}</Text></TouchableOpacity>))}
      </View>
      <Text style={styles.label}>Study style:</Text>
      <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('style'); setIsModalVisible(true); }}><Text>{profileData.style}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn} onPress={() => setOnboardingStep(2)}><Text style={styles.loginBtnText}>next</Text></TouchableOpacity>
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalContent}><ScrollView>{getOptions().map((item) => (<TouchableOpacity key={item} onPress={() => { setProfileData({...profileData, [currentField]: item}); setIsModalVisible(false); }}><Text style={styles.modalItem}>{item}</Text></TouchableOpacity>))}</ScrollView></View></View>
      </Modal>
    </View>
  );

  if (onboardingStep === 2) return (
    <View style={styles.loginContainer}>
      <Text style={styles.welcomeText}>Finish your profile</Text>
      <TouchableOpacity style={styles.photoContainer} onPress={openCamera}><Text style={styles.placeholderIcon}>👤</Text><Text style={styles.addPhotoText}>Add photo!</Text></TouchableOpacity>
      <TextInput style={styles.bioInput} placeholder="Bio..." multiline placeholderTextColor="#A1887F" />
      <Text style={styles.label}>Find study spots near me!</Text>
      <TouchableOpacity style={styles.locationBtn} onPress={handleLogin}><Text style={{color: '#4E342E'}}>share your location</Text></TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn} onPress={() => setOnboardingStep(3)}><Text style={styles.loginBtnText}>Done</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert("Settings")}><Text style={styles.headerText}>⚙️ Settings</Text></TouchableOpacity>
        <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
      </View>
      <MapView style={styles.map} showsUserLocation={true} followsUserLocation={true} initialRegion={{ latitude: location?.coords.latitude || 37.9838, longitude: location?.coords.longitude || 23.7275, latitudeDelta: 0.05, longitudeDelta: 0.05 }} />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => Alert.alert("Cafes")}><Text style={styles.navIcon}>☕</Text><Text style={styles.navLabel}>Cafes</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={openCamera}><Text style={styles.navIcon}>📷</Text><Text style={styles.navLabel}>Post</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setIsChatVisible(true)}><Text style={styles.navIcon}>🤖</Text><Text style={styles.navLabel}>AI Chat</Text></TouchableOpacity>
      </View>
      
      <Modal visible={isChatVisible} animationType="slide">
        <View style={styles.chatContainer}>
          <Text style={styles.modalTitle}>Study AI Assistant</Text>
          <ScrollView style={{flex: 1}}>{chatMessages.map((m, i) => <Text key={i} style={m.role === 'user' ? styles.userMsg : styles.botMsg}>{m.text}</Text>)}</ScrollView>
          {isThinking && <ActivityIndicator />}
          <View style={styles.inputRow}>
            <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Type..." />
            <TouchableOpacity onPress={handleSend}><Text style={{fontWeight:'bold'}}>Send</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setIsChatVisible(false)}><Text style={{textAlign:'center', color:'red'}}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
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
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#4E342E', marginBottom: 25, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#4E342E', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#D7CCC8', justifyContent: 'center' },
  loginBtn: { backgroundColor: '#4E342E', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  loginBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  interestBtn: { backgroundColor: '#FFF', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#D7CCC8', width: '30%', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, maxHeight: '80%' },
  modalItem: { padding: 15, fontSize: 18, borderBottomWidth: 1, borderColor: '#EEE', textAlign: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  placeholderIcon: { fontSize: 80, color: '#4E342E' },
  addPhotoText: { fontSize: 16, fontWeight: '600', color: '#4E342E' },
  bioInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, height: 100, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#D7CCC8' },
  locationBtn: { backgroundColor: '#FFF', padding: 15, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#4E342E', marginBottom: 20 },
  chatContainer: { flex: 1, padding: 40, backgroundColor: '#FAF3E0' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: '#4E342E', color: '#FFF', padding: 10, borderRadius: 10, margin: 5 },
  botMsg: { alignSelf: 'flex-start', backgroundColor: '#FFF', padding: 10, borderRadius: 10, margin: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#D7CCC8', borderRadius: 20, padding: 10, marginRight: 10 }
});