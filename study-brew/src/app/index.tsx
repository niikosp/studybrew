import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ActivityIndicator, Animated, Alert, Modal, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

// Αρχικοποίηση AI
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");

// Ψεύτικα δεδομένα για καφέ
const dummyCafes = [
  { id: 1, name: "Study Grounds", location: "Exarcheia", coords: { latitude: 37.9858, longitude: 23.7355 }, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24', rating: "⭐⭐⭐⭐⭐" },
  { id: 2, name: "The Library Cafe", location: "Syntagma", coords: { latitude: 37.9755, longitude: 23.7348 }, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085', rating: "⭐⭐⭐⭐" },
  { id: 3, name: "Brew & Book", location: "Kolonaki", coords: { latitude: 37.9785, longitude: 23.7420 }, image: 'https://images.unsplash.com/photo-1501339817302-cd4468881444', rating: "⭐⭐⭐⭐⭐" }
];

export default function StudyBrewApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0); 
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  
  // Visibility States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAccountVisible, setIsAccountVisible] = useState(false);
  const [isCafesVisible, setIsCafesVisible] = useState(false);
  
  // AI States
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'bot', text: 'Γεια! Πώς μπορώ να βοηθήσω στο διάβασμα;' }]);
  const [inputText, setInputText] = useState('');
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);

  // Profile data
  const [currentField, setCurrentField] = useState<string>('');
  const [profileData, setProfileData] = useState({ studies: 'Select', level: 'Select', style: 'Select', detail: '' });
  const [interests, setInterests] = useState(['TECH', 'BUSINESS', 'ART']);
  
  // Reservation states
  const [selectedCafe, setSelectedCafe] = useState<any>(null);
  const [reservationType, setReservationType] = useState<'alone' | 'team' | null>(null);
  const [teamOption, setTeamOption] = useState<'friends' | 'others' | null>(null);

  // States για την αλλαγή ημερομηνίας/ώρας
  const [resDate, setResDate] = useState('dd/mm/yy');
  const [resTime, setResTime] = useState('00:00');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const timer = setTimeout(() => setIsLoading(false), 3000);
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
      const result = await chatSession.sendMessage(inputText);
      const responseText = await result.response.text();
      setChatMessages([...newMessages, { role: 'bot', text: responseText }]);
    } catch (e) {
      setChatMessages([...newMessages, { role: 'bot', text: "Σφάλμα σύνδεσης." }]);
    } finally {
      setIsThinking(false);
    }
  };

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

  const getOptions = () => {
    if (currentField === 'level') return ['Λύκειο', 'Προπτυχιακός', 'Μεταπτυχιακός', 'Διδακτορικός'];
    if (currentField === 'studies') return ['Ανθρωπιστικών', 'Θετικών', 'Υγείας', 'Οικονομίας', 'Άλλο'];
    return ['Hybrid', 'Silent', 'Group Study', 'Café Vibes'];
  };

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
        {interests.map((i, idx) => (
            <TouchableOpacity key={idx} style={styles.interestBtn}>
                <Text style={{fontSize: 10, fontWeight: 'bold'}}>{i}</Text>
            </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Study style:</Text>
      <TouchableOpacity style={styles.input} onPress={() => { setCurrentField('style'); setIsModalVisible(true); }}><Text>{profileData.style}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.loginBtn} onPress={() => setOnboardingStep(2)}><Text style={styles.loginBtnText}>next</Text></TouchableOpacity>
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalContent}><ScrollView>{getOptions().map((item) => (<TouchableOpacity key={item} onPress={() => { setProfileData({...profileData, [currentField as keyof typeof profileData]: item}); setIsModalVisible(false); }}><Text style={styles.modalItem}>{item}</Text></TouchableOpacity>))}</ScrollView></View></View>
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
        <TouchableOpacity onPress={() => setIsSettingsVisible(true)}>
            <Text style={styles.headerText}>⚙️ Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsAccountVisible(true)}>
            <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.profilePic} />
        </TouchableOpacity>
      </View>

      <MapView 
        style={styles.map} 
        showsUserLocation={true} 
        initialRegion={{ 
            latitude: location?.coords.latitude || 37.9838, 
            longitude: location?.coords.longitude || 23.7275, 
            latitudeDelta: 0.05, 
            longitudeDelta: 0.05 
        }} 
        onPress={() => {
            setSelectedCafe(null);
            setReservationType(null);
            setTeamOption(null);
        }}
      >
        {dummyCafes.map(cafe => (
          <Marker 
            key={cafe.id}
            coordinate={cafe.coords}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedCafe(cafe);
            }}
          >
            <View style={styles.customMarker}><Text style={{fontSize: 20}}>☕</Text></View>
          </Marker>
        ))}
      </MapView>
      
      {selectedCafe && (
        <View style={styles.reservationOverlay}>
            <View style={styles.reservationCard}>
                <View style={styles.resLeft}>
                    <Text style={styles.resRedTitle}>Reservation</Text>
                    
                    <View style={styles.resTypeRow}>
                        <TouchableOpacity 
                            style={[styles.resTypeBox, reservationType === 'alone' && styles.activeBox]} 
                            onPress={() => {setReservationType('alone'); setTeamOption(null);}}
                        >
                            <Text style={styles.resTypeText}>Alone</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.resTypeBox, reservationType === 'team' && styles.activeBox]} 
                            onPress={() => setReservationType('team')}
                        >
                            <Text style={styles.resTypeText}>Team</Text>
                        </TouchableOpacity>
                    </View>

                    {reservationType === 'team' && (
                        <View style={styles.teamOptionsRow}>
                            <TouchableOpacity 
                                style={[styles.smallOptionBox, teamOption === 'friends' && styles.activeBox]}
                                onPress={() => setTeamOption('friends')}
                            >
                                <Text style={styles.smallOptionText}>with friends</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.smallOptionBox, teamOption === 'others' && styles.activeBox]}
                                onPress={() => setTeamOption('others')}
                            >
                                <Text style={styles.smallOptionText}>other people</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
                      <Text style={styles.resDateTime}>When: {resDate}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsTimePickerVisible(true)}>
                      <Text style={styles.resDateTime}>Time: {resTime}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => { setSelectedCafe(null); Alert.alert("Confirmed", "Reservation Sent!"); }}>
                        <Text style={styles.resDoneBtn}>DONE</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.resRight}>
                    <Text style={styles.resShopName}>{selectedCafe.name}</Text>
                    <Image source={{ uri: selectedCafe.image }} style={styles.resImage} />
                    <Text style={styles.resRating}>rating {selectedCafe.rating}</Text>
                    <Text style={styles.resRedTitleSmall}>Reservation</Text>
                </View>
            </View>
        </View>
      )}

      {/* DATE PICKER MODAL */}
      <Modal visible={isDatePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Date</Text>
            <TextInput style={styles.input} placeholder="dd/mm/yy" onChangeText={setResDate} value={resDate} />
            <TouchableOpacity style={styles.loginBtn} onPress={() => setIsDatePickerVisible(false)}><Text style={styles.loginBtnText}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal visible={isTimePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Time</Text>
            <TextInput style={styles.input} placeholder="00:00" onChangeText={setResTime} value={resTime} />
            <TouchableOpacity style={styles.loginBtn} onPress={() => setIsTimePickerVisible(false)}><Text style={styles.loginBtnText}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setIsCafesVisible(true)}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Cafes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={openCamera}><Text style={styles.navIcon}>📷</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => setIsChatVisible(true)}><Text style={styles.navIcon}>🤖</Text></TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal visible={isSettingsVisible} animationType="fade">
        <View style={styles.settingsContainer}>
          <ScrollView contentContainerStyle={{paddingBottom: 40}}>
              <TouchableOpacity style={{marginTop: 20}} onPress={() => setIsSettingsVisible(false)}>
                <Text style={styles.settingsTitle}>Settings</Text>
              </TouchableOpacity>
              <Text style={styles.settingsLabel}>Language: English</Text>
              <Text style={styles.settingsLabel}>Notifications: ON</Text>
              <Text style={styles.settingsLabel}>Privacy</Text>
              <Text style={styles.settingsLabel}>Dark mode: Off</Text>
              <Text style={styles.settingsLabel}>More about the team</Text>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => { setIsSettingsVisible(false); setOnboardingStep(0); setIsLoggedIn(false); }}>
                <Text style={styles.logoutText}>Log out</Text>
              </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={isAccountVisible} animationType="slide">
        <View style={styles.accountContainer}>
          <TouchableOpacity onPress={() => setIsAccountVisible(false)}>
            <Text style={styles.accountTitle}>Account</Text>
          </TouchableOpacity>
          
          <View style={styles.accountHeaderRow}>
            <View style={styles.profileIconContainer}>
               <Text style={styles.largeProfileIcon}>👤</Text>
               <TouchableOpacity style={styles.plusCircle}><Text style={styles.plusText}>+</Text></TouchableOpacity>
            </View>
            <Text style={styles.displayNameText}>Display name</Text>
          </View>

          <View style={styles.bioBox}>
             <Text style={styles.bioTitle}>Bio</Text>
          </View>

          <View style={styles.friendActionRow}>
            <TouchableOpacity style={styles.friendBtn}><Text style={styles.friendBtnText}>My friends🫂</Text></TouchableOpacity>
            <TouchableOpacity style={styles.friendBtn}><Text style={styles.friendBtnText}>🔍 Find more friends</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editInfoBtn}>
            <Text style={styles.editInfoText}>Edit personal info</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={isChatVisible} animationType="slide">
        <View style={styles.chatContainer}>
          <Text style={styles.modalTitle}>Study AI Assistant</Text>
          <ScrollView style={{flex: 1}}>{chatMessages.map((m, i) => <Text key={i} style={m.role === 'user' ? styles.userMsg : styles.botMsg}>{m.text}</Text>)}</ScrollView>
          <View style={styles.inputRow}>
            <TextInput style={styles.chatInput} value={inputText} onChangeText={setInputText} placeholder="Type..." />
            <TouchableOpacity onPress={handleSend}><Text style={{fontWeight:'bold'}}>Send</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setIsChatVisible(false)}><Text style={{textAlign:'center', color:'red'}}>Close</Text></TouchableOpacity>
        </View>
      </Modal>

      {/* Cafes Modal */}
      <Modal visible={isCafesVisible} animationType="slide">
        <View style={styles.cafesContainer}>
          <Text style={styles.modalTitle}>Available Cafes</Text>
          <ScrollView>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={styles.cafeCard}>
                {i === 0 && <Text style={{ color: 'red', fontWeight: 'bold' }}>SPONSORED</Text>}
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Coffee Shop {i + 1}</Text>
                <Text>⭐⭐⭐⭐⭐ - Great for studying!</Text>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24' }} style={{ height: 100, borderRadius: 10, marginVertical: 5 }} />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setIsCafesVisible(false)}><Text style={{ textAlign: 'center', padding: 20, color: 'red' }}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#C8A276', justifyContent: 'center', alignItems: 'center' },
  mainLogo: { width: 300, height: 150 },
  mainContainer: { flex: 1, backgroundColor: '#FAF3E0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, alignItems: 'center', backgroundColor: '#FAF3E0' },
  headerText: { fontSize: 16, fontWeight: '600', color: '#4E342E' },
  profilePic: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: '#4E342E' },
  map: { flex: 1 },
  customMarker: { backgroundColor: '#FFF', padding: 5, borderRadius: 20, borderWidth: 1, borderColor: '#000' },
  reservationOverlay: { position: 'absolute', bottom: 110, left: 10, right: 10, zIndex: 10 },
  reservationCard: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 2, borderColor: '#000', flexDirection: 'row', padding: 8, height: 260 },
  resLeft: { flex: 1.3, borderRightWidth: 1, borderColor: '#000', paddingRight: 8, justifyContent: 'space-between' },
  resRight: { flex: 1, paddingLeft: 8, alignItems: 'center', justifyContent: 'center' },
  resRedTitle: { color: '#A52A2A', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  resRedTitleSmall: { color: '#A52A2A', fontSize: 14, fontWeight: 'bold' },
  resTypeRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  resTypeBox: { borderWidth: 1, borderColor: '#000', padding: 4, width: 55, alignItems: 'center' },
  activeBox: { backgroundColor: '#E0E0E0' }, 
  resTypeText: { fontWeight: 'bold', fontSize: 12 },
  teamOptionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  smallOptionBox: { borderWidth: 1, borderColor: '#000', padding: 3, flex: 0.48, alignItems: 'center' },
  smallOptionText: { fontSize: 9, fontWeight: 'bold' },
  resDateTime: { fontSize: 14, fontWeight: 'bold', marginVertical: 1, color: '#4E342E', textDecorationLine: 'underline' },
  resDoneBtn: { color: '#A52A2A', fontSize: 22, fontWeight: 'bold', textAlign: 'center', textDecorationLine: 'underline' },
  resShopName: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  resImage: { width: '100%', height: 80, borderRadius: 5, marginVertical: 5 },
  resRating: { fontSize: 10, marginBottom: 5 },
  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#FAF3E0', borderTopWidth: 2, borderTopColor: '#000' },
  navBtn: { alignItems: 'center' },
  navIcon: { fontSize: 35 },
  navLabel: { fontSize: 12, color: '#4E342E', fontWeight: '500' },
  loginContainer: { flex: 1, backgroundColor: '#FAF3E0', padding: 30, justifyContent: 'center' },
  smallLogo: { width: 200, height: 100, alignSelf: 'center', marginBottom: 20 },
  inputArea: { width: '100%' },
  welcomeText: { fontSize: 22, fontWeight: '700', color: '#4E342E', marginBottom: 25, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#4E342E', marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#D7CCC8' },
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
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#D7CCC8', borderRadius: 20, padding: 10, marginRight: 10 },
  settingsContainer: { flex: 1, backgroundColor: '#FAF3E0', padding: 40 },
  settingsTitle: { fontSize: 40, fontWeight: 'bold', color: '#4E342E', marginBottom: 40 },
  settingsLabel: { fontSize: 22, fontWeight: 'bold', color: '#4E342E', marginVertical: 20 },
  logoutBtn: { marginTop: 60, alignSelf: 'flex-end' },
  logoutText: { fontSize: 20, fontWeight: 'bold', color: '#B22222', textDecorationLine: 'underline' },
  accountContainer: { flex: 1, backgroundColor: '#FDE4C3', padding: 40 },
  accountTitle: { fontSize: 40, fontWeight: 'bold', color: '#4E342E', marginBottom: 30 },
  accountHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  profileIconContainer: { position: 'relative' },
  largeProfileIcon: { fontSize: 100, color: '#4E342E' },
  plusCircle: { position: 'absolute', bottom: 10, right: 0, backgroundColor: '#FAF3E0', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B22222' },
  plusText: { color: '#B22222', fontWeight: 'bold', fontSize: 20 },
  displayNameText: { fontSize: 24, fontWeight: 'bold', color: '#4E342E', marginLeft: 20 },
  bioBox: { borderWidth: 1, borderColor: '#4E342E', borderRadius: 5, height: 200, padding: 15, marginBottom: 40 },
  bioTitle: { fontSize: 22, fontWeight: 'bold', color: '#4E342E' },
  friendActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  friendBtn: { borderBottomWidth: 1, borderColor: '#4E342E' },
  friendBtnText: { fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
  editInfoBtn: { borderBottomWidth: 1, borderColor: '#4E342E', alignSelf: 'flex-start' },
  editInfoText: { fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
  cafesContainer: { flex: 1, padding: 40, backgroundColor: '#FAF3E0' },
  cafeCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#D7CCC8' }
});