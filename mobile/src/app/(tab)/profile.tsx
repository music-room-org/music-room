import { View, Text, TextInput, ScrollView, StyleSheet, Image, Platform, Modal, TouchableOpacity, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check, X, Pencil, UserPlus, ChevronRight, LogOut, Bell } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, FONTS } from "@/constants";
import { ProfileStat, ProfileActionButton, ActivityItem, FriendAvatar } from "@/components";
import { useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

export default function Profile() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [friendsList, setFriendsList] = useState<any[]>([]);
    const [isAddFriendModalVisible, setIsAddFriendModalVisible] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [collabRequests, setCollabRequests] = useState<any[]>([]);
    const [playlistsCount, setPlaylistsCount] = useState(0);

    // Nouveaux états pour la modale d'aperçu d'un ami
    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [friendPreviewData, setFriendPreviewData] = useState<{ friendCount: number, playlists: any[] }>({ friendCount: 0, playlists: [] });
    const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

    const apiUrl = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
                    if (!token) {
                        router.replace('/login');
                        return;
                    }

                    const response = await fetch(`${apiUrl}/auth/profil`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await response.json();
                    setUsername(data.username);
                    setProfileImage(data.profileImage);

                    const requestsResponse = await fetch(`${apiUrl}/friends/pending`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (requestsResponse.ok) {
                        setFriendRequests(await requestsResponse.json());
                    }

                    const friendsResponse = await fetch(`${apiUrl}/friends/list`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (friendsResponse.ok) {
                        setFriendsList(await friendsResponse.json());
                    }

                    const collabResponse = await fetch(`${apiUrl}/playlists/collaborators/pending`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (collabResponse.ok) {
                        setCollabRequests(await collabResponse.json());
                    }

                    const myPlaylistsResponse = await fetch(`${apiUrl}/playlists/mine`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (myPlaylistsResponse.ok) {
                        const myPlaylists = await myPlaylistsResponse.json();
                        setPlaylistsCount(myPlaylists.length);
                    }

                } catch (error) {
                    console.error(error);
                }
            };

            fetchProfile();

            const sub = DeviceEventEmitter.addListener("refreshProfile", () => {
                fetchProfile();
            });

            return () => {
                sub.remove();
            };
        }, [])
    );

    async function handleLogout() {
        if (Platform.OS === "web") {
            localStorage.removeItem("userToken");
        } else {
            await SecureStore.deleteItemAsync("userToken");
        }
        router.replace("/login");
    }

    const handleRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
        const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
        if (!token) return;

        await fetch(`${apiUrl}/friends/manage`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ friendshipId: requestId, status }),
        });

        setFriendRequests((prev) => {
            const updatedRequests = prev.filter((request) => request.id !== requestId);
            if (updatedRequests.length === 0 && collabRequests.length === 0) {
                DeviceEventEmitter.emit("clearNotification");
            }
            return updatedRequests;
        });
    };

    const handleCollabRequest = async (collabId: string, status: "ACCEPTED" | "REJECTED") => {
        const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
        if (!token) return;

        await fetch(`${apiUrl}/playlists/collaborators/${collabId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status }),
        });

        setCollabRequests((prev) => {
            const updatedCollabs = prev.filter((req) => req.id !== collabId);
            if (updatedCollabs.length === 0 && friendRequests.length === 0) {
                DeviceEventEmitter.emit("clearNotification");
            }
            return updatedCollabs;
        });
    };

    const handleUserSearch = async (query: string) => {
        setUserSearchQuery(query);
        if (!query.trim()) {
            setUserSearchResults([]);
            return;
        }
        const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/friends/search?q=${encodeURIComponent(query)}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                setUserSearchResults(await response.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendFriendRequest = async (targetId: string) => {
        const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/friends/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ receiverId: targetId }),
            });
            if (response.ok) {
                setSentRequests((prev) => [...prev, targetId]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openFriendPreview = async (friendUser: any) => {
        setSelectedFriend(friendUser);
        setIsPreviewModalVisible(true);
        setFriendPreviewData({ friendCount: 0, playlists: [] });

        try {
            const token = Platform.OS === "web" ? localStorage.getItem("userToken") : await SecureStore.getItemAsync("userToken");
            if (!token) return;
            
            const response = await fetch(`${apiUrl}/friends/profile/${friendUser.id}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setFriendPreviewData(data);
            }
        } catch (err) {
            console.error("Erreur lors de la récupération de l'aperçu du profil", err);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <ChevronLeft color="white" />
                        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.bellContainer}>
                            <Bell size={24} color={COLORS.textPrimary} />
                            {(friendRequests.length > 0 || collabRequests.length > 0) && (
                                <View style={styles.notificationDot}></View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.avatarWrapper}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar} />
                        )}
                    </View>
                    <Text style={styles.handleText}>@{username}</Text>

                    <View style={styles.statsRow}>
                        <ProfileStat value={playlistsCount.toString()} label="playlists" />
                        <ProfileStat value={friendsList.length.toString()} label="friends" />
                    </View>

                    <View style={styles.buttonsContainer}>
                        <ProfileActionButton title="Modify my profile" isPrimary={true} icon={<Pencil color={COLORS.primary} />} onPress={() => router.push("/edit-profile")} />
                        <ProfileActionButton title="Add a friend" isPrimary={false} icon={<UserPlus color="black" />} onPress={() => setIsAddFriendModalVisible(true)} />
                        <ProfileActionButton title="Log out" isPrimary={false} icon={<LogOut color='black' />} onPress={() => handleLogout()} />
                    </View>

                    <View style={styles.divider}></View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Friends</Text>
                        <ChevronRight color={COLORS.textPrimary} />
                    </View>
                </View>

                {friendsList.length === 0 ? (
                    <Text style={styles.noFriendsText}>
                        No friend yet
                    </Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
                        {friendsList.map((friend) => {
                            const friendUser = friend.sender?.username === username ? friend.receiver : friend.sender;
                            return (
                                <TouchableOpacity key={friend.id} onPress={() => openFriendPreview(friendUser)} activeOpacity={0.7}>
                                    <FriendAvatar name={friendUser?.username} profileImage={friendUser?.profileImage} bgColor="#E5F2EE" />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </ScrollView>

            <Modal visible={isPreviewModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsPreviewModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.previewModalContent}>
                        <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} style={styles.closePreviewBtn}>
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>

                        <Image source={{ uri: selectedFriend?.profileImage || "https://via.placeholder.com/100" }} style={styles.previewAvatar} />
                        <Text style={styles.previewUsername}>{selectedFriend?.username}</Text>
                        <Text style={styles.previewStats}>{friendPreviewData.friendCount} friends</Text>

                        <View style={styles.previewDivider} />

                        <Text style={styles.previewSectionTitle}>{selectedFriend?.username} activity:</Text>
                        
                        {friendPreviewData.playlists.length > 0 ? (
                            friendPreviewData.playlists.map(pl => (
                                <ActivityItem 
                                    key={pl.id} 
                                    title={pl.name} 
                                    description="Public Playlist" 
                                    time="" 
                                    imageUrl={pl.imageUrl || "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"} 
                                />
                            ))
                        ) : (
                            <Text style={styles.noActivityText}>No activity yet</Text>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal visible={isModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>

                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                style={styles.closeModalBtn}
                            >
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalContent}
                        >
                            {friendRequests.length === 0 && collabRequests.length === 0 && (
                                <Text style={styles.noNotificationsText}>
                                    No notifications
                                </Text>
                            )}

                            {friendRequests.length > 0 && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>
                                        Friend requests
                                    </Text>

                                    {friendRequests.map((request: any) => (
                                        <View key={request.id} style={styles.requestRow}>
                                            <View style={styles.requestUser}>
                                                {request.sender?.profileImage ? (
                                                    <Image
                                                        source={{ uri: request.sender.profileImage }}
                                                        style={styles.requestAvatar}
                                                    />
                                                ) : (
                                                    <View style={styles.requestAvatar} />
                                                )}

                                                <View style={styles.requestInfo}>
                                                    <Text style={styles.requestUsername}>
                                                        {request.sender?.username}
                                                    </Text>

                                                    <Text style={styles.requestDescription}>
                                                        Friend request
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.requestActions}>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleRequest(request.id, "ACCEPTED")
                                                    }
                                                    style={styles.acceptButton}
                                                >
                                                    <Check size={21} color="#FFFFFF" />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleRequest(request.id, "REJECTED")
                                                    }
                                                    style={styles.rejectButton}
                                                >
                                                    <X size={21} color={COLORS.textPrimary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {collabRequests.length > 0 && (
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>
                                        Collaboration requests
                                    </Text>

                                    {collabRequests.map((req: any) => (
                                        <View key={req.id} style={styles.requestRow}>
                                            <View style={styles.requestUser}>
                                                <Image
                                                    source={{
                                                        uri:
                                                            req.playlist?.imageUrl ||
                                                            "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png",
                                                    }}
                                                    style={styles.requestAvatar}
                                                />

                                                <View style={styles.requestInfo}>
                                                    <Text
                                                        style={styles.requestUsername}
                                                        numberOfLines={1}
                                                    >
                                                        {req.playlist?.name}
                                                    </Text>

                                                    <Text
                                                        style={styles.requestDescription}
                                                        numberOfLines={1}
                                                    >
                                                        Invited by {req.playlist?.owner?.username}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.requestActions}>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleCollabRequest(req.id, "ACCEPTED")
                                                    }
                                                    style={styles.acceptButton}
                                                >
                                                    <Check size={21} color="#FFFFFF" />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleCollabRequest(req.id, "REJECTED")
                                                    }
                                                    style={styles.rejectButton}
                                                >
                                                    <X size={21} color={COLORS.textPrimary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={isAddFriendModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Add a friend</Text>
                                <Text style={styles.modalSubtitle}>
                                    Search for someone to add to your friends
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setIsAddFriendModalVisible(false)}
                                style={styles.closeModalBtn}
                            >
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <UserPlus
                                size={20}
                                color={COLORS.textMuted}
                            />

                            <TextInput
                                value={userSearchQuery}
                                onChangeText={handleUserSearch}
                                placeholder="Search a friend..."
                                placeholderTextColor={COLORS.textMuted}
                                autoCapitalize="none"
                                style={styles.searchInput}
                            />
                        </View>

                        {userSearchResults.length > 0 && (
                            <View style={styles.searchResults}>
                                {userSearchResults.map((user: any) => {
                                    const isAlreadyFriend = friendsList.some((friend: any) => 
                                        friend.sender?.id === user.id || friend.receiver?.id === user.id
                                    );
                                    const isSent = sentRequests.includes(user.id);
                                    const cannotAdd = isAlreadyFriend || isSent;

                                    return (
                                        <View key={user.id} style={styles.searchResultItem}>
                                            <View style={styles.searchResultInfo}>
                                                {user.profileImage ? (
                                                    <Image
                                                        source={{ uri: user.profileImage }}
                                                        style={styles.searchResultImage}
                                                    />
                                                ) : (
                                                    <View style={styles.searchResultImage} />
                                                )}

                                                <Text style={styles.searchResultUsername}>
                                                    {user.username}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (!cannotAdd) sendFriendRequest(user.id);
                                                }}
                                                disabled={cannotAdd}
                                                style={[
                                                    styles.addFriendButton,
                                                    cannotAdd && styles.friendRequestSent,
                                                ]}
                                            >
                                                {cannotAdd ? (
                                                    <Check
                                                        size={19}
                                                        color={COLORS.primary}
                                                    />
                                                ) : (
                                                    <UserPlus
                                                        size={19}
                                                        color={COLORS.textPrimary}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {userSearchQuery.trim() !== "" &&
                            userSearchResults.length === 0 && (
                                <Text style={styles.noResultsText}>
                                    No users found
                                </Text>
                            )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#ffffff", },
    scrollView: { flex: 1, },
    searchResults: { marginTop: 2, },
    scrollContent: { paddingBottom: 170, paddingTop: 20, },
    searchResultUsername: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary, marginLeft: 12, },
    addFriendButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F1F1F1", alignItems: "center", justifyContent: "center", },
    friendRequestSent: { backgroundColor: "#E8F5E9", },
    noResultsText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: "center", paddingVertical: 20, },
    header: { paddingHorizontal: 24, marginBottom: 16, },
    headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, },
    bellContainer: { position: "relative", },
    notificationDot: { position: "absolute", top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: "red", },
    avatarWrapper: { alignSelf: "center", marginBottom: 16, alignItems: "center", },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#E0E0E0", },
    nameTitle: { fontFamily: FONTS.semiBold, fontSize: 20, textAlign: "center", },
    handleText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, textAlign: "center", },
    statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginVertical: 24, paddingHorizontal: 24, },
    buttonsContainer: { paddingHorizontal: 24, },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 16, },
    sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 18, },
    activityContainer: { paddingHorizontal: 24, },
    friendsScroll: { paddingHorizontal: 24, marginLeft: 25, flexGrow: 1, justifyContent: 'flex-start', },
    divider: { height: 1, backgroundColor: COLORS.cardBorder, marginHorizontal: 24, marginVertical: 12, },
    sectionHeaderModal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, },
    activityContainerModal: { paddingHorizontal: 0, },
    dividerModal: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 12, },
    searchResultItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, },
    searchResultInfo: { flexDirection: "row", alignItems: "center", gap: 12, },
    searchResultImage: { width: 40, height: 40, borderRadius: 20, },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.45)", justifyContent: "center", paddingHorizontal: 24, },
    modalContainer: { backgroundColor: "#FFFFFF", borderRadius: 24, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, maxHeight: "75%", },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, },
    modalTitle: { fontFamily: FONTS.semiBold, fontSize: 22, color: COLORS.textPrimary, },
    closeModalBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", },
    modalContent: { paddingBottom: 8, },
    modalSection: { marginBottom: 24, },
    modalSectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.textPrimary, marginBottom: 14, },
    requestRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, },
    requestUser: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, },
    requestAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E0E0E0", },
    requestInfo: { flex: 1, marginLeft: 12, marginRight: 12, },
    requestUsername: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4, },
    requestDescription: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, },
    requestActions: { flexDirection: "row", alignItems: "center", gap: 8, },
    acceptButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", },
    rejectButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F1F1F1", alignItems: "center", justifyContent: "center", },
    noNotificationsText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        paddingVertical: 30,
    },
    modalSubtitle: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 10,
        maxWidth: 250,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 52,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        padding: 12,
        marginLeft: 10,
    },
    previewModalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        alignItems: "center",
    },
    closePreviewBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 1,
    },
    previewAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#E0E0E0",
        marginBottom: 12,
        marginTop: 10,
    },
    previewUsername: {
        fontFamily: FONTS.semiBold,
        fontSize: 20,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    previewStats: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 20,
    },
    previewDivider: {
        height: 1,
        width: "100%",
        backgroundColor: COLORS.cardBorder,
        marginBottom: 20,
    },
    previewSectionTitle: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textPrimary,
        alignSelf: "flex-start",
        marginBottom: 16,
    },
    noActivityText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
        paddingVertical: 10,
    },
    noFriendsText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.textMuted,
        paddingHorizontal: 24,
        marginTop: 10,
    },
});