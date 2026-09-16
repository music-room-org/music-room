import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, PlusCircle, List, User } from "lucide-react-native";
import { COLORS, FONTS } from "@/constants";
import { LibraryPlaylistItem } from "@/components";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

async function getToken() {
    if (Platform.OS === "web") return localStorage.getItem("userToken");
    return await SecureStore.getItemAsync("userToken");
}

export default function Library() {
    const router = useRouter();
    const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [myPlaylists, setMyPlaylists] = useState([]);
    const [isTypeMenuVisible, setIsTypeMenuVisible] = useState(false);
    const [friendSearchQuery, setFriendSearchQuery] = useState("");
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [friendsList, setFriendsList] = useState<any[]>([]);
    const [myUsername, setMyUsername] = useState("");

    const handleCreatePlaylist = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const response = await fetch(`${apiUrl}/playlists`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newPlaylistName }),
            });
            const newPlaylist = await response.json();

            if (selectedFriendId) {
                await fetch(`${apiUrl}/playlists/${newPlaylist.id}/collaborators`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userId: selectedFriendId }),
                });
            }

            setIsCreateModalVisible(false);
            setNewPlaylistName("");
            setFriendSearchQuery("");
            setSelectedFriendId(null);
            router.push(`/playlist/${newPlaylist.id}`);
        } catch (error) {
            console.error(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchPlaylists = async () => {
                try {
                    const token = await getToken();
                    if (!token) return;

                    const profileRes = await fetch(`${apiUrl}/auth/profil`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setMyUsername(profileData.username);
                    }

                    const response = await fetch(`${apiUrl}/playlists/mine`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await response.json();
                    setMyPlaylists(data);

                    const friendsResponse = await fetch(`${apiUrl}/friends/list`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const friendsData = await friendsResponse.json();
                    setFriendsList(friendsData);
                } catch (error) {
                    console.error(error);
                }
            };

            fetchPlaylists();
        }, [])
    );

    const filteredFriends = friendSearchQuery.trim() === "" 
        ? [] 
        : friendsList.filter((friend: any) => {
            const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
            return friendUser?.username?.toLowerCase().includes(friendSearchQuery.toLowerCase());
        });

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerTopRow}>
                        <Text style={styles.headerTitle}>My library</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity>
                                <Search size={26} color={COLORS.textMuted}/>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionIcon} onPress={() => setIsTypeMenuVisible(true)}>
                                <PlusCircle size={26} color={COLORS.textMuted}/>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.yellowLine}></View>
                </View>

                <View style={styles.listContainer}>
                    {myPlaylists.map((playlist: any) => (
                        <TouchableOpacity key={playlist.id} onPress={() => router.push(`/playlist/${playlist.id}`)}>
                            <LibraryPlaylistItem 
                                title={playlist.name} 
                                author={`Playlist by ${playlist.owner?.username || myUsername}`}
                                imageUrl={playlist.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <Modal visible={isTypeMenuVisible} transparent={true} animationType="slide" onRequestClose={() => setIsTypeMenuVisible(false)}>
                <View style={styles.typeMenuOverlay}>
                    <View style={styles.typeMenu}>
                        <TouchableOpacity style={styles.typeMenuItem} onPress={() => { setIsTypeMenuVisible(false); setIsCreateModalVisible(true); }}>
                            <List size={24} color={COLORS.textPrimary} />
                            <Text style={styles.typeMenuText}> Playlist classique </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.typeMenuItem} onPress={() => { setIsTypeMenuVisible(false); setIsCreateModalVisible(true); }}>
                            <User size={24} color={COLORS.textPrimary} />
                            <Text style={styles.typeMenuText}> Playlist collaborative </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={isCreateModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalBox}>
                        <TextInput 
                            value={newPlaylistName} 
                            onChangeText={setNewPlaylistName} 
                            placeholder="Playlist name" 
                            style={styles.modalInput} 
                        />
                        <TextInput 
                            value={friendSearchQuery} 
                            onChangeText={setFriendSearchQuery} 
                            placeholder="Search for a friend" 
                            autoCapitalize="none" 
                            style={styles.modalInputMargin} 
                        />
                        {filteredFriends.map((friend: any) => {
                            const friendUser = friend.sender?.username === myUsername ? friend.receiver : friend.sender;
                            return (
                                <TouchableOpacity 
                                    key={friendUser.id} 
                                    onPress={() => { 
                                        setSelectedFriendId(friendUser.id); 
                                        setFriendSearchQuery(friendUser.username); 
                                    }} 
                                    style={[
                                        styles.friendSelectBtn, 
                                        { backgroundColor: selectedFriendId === friendUser.id ? "#e5e5e5" : "#f5f5f5" }
                                    ]}
                                >
                                    <Text>{friendUser.username}</Text>
                                </TouchableOpacity>
                            );
                        })}
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)} style={styles.cancelBtn}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCreatePlaylist}>
                                <Text>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100,
    },
    headerContainer: {
        marginBottom: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    headerTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 28,
        color: COLORS.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginLeft: 16,
    },
    yellowLine: {
        height: 4,
        backgroundColor: COLORS.primary,
        width: '100%',
        borderRadius: 2,
        marginTop: 16,
    },
    typeMenuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    typeMenu: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    typeMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
    },
    typeMenuText: {
        marginLeft: 16,
        fontFamily: FONTS.semiBold,
        fontSize: 17,
        color: COLORS.textPrimary,
    },
    listContainer: {
        marginTop: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        width: "80%",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        color: "#777373",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    modalInputMargin: {
        borderWidth: 1,
        borderColor: "#ddd",
        color: "#777373",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    friendSelectBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 6,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
    },
    cancelBtn: {
        marginRight: 16,
    }
});