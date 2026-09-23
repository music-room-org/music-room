import { useEffect } from "react";
import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { PlayerProvider } from "@/context/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";
import {
	useFonts,
	Fredoka_400Regular,
	Fredoka_500Medium,
	Fredoka_600SemiBold,
	Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";

SplashScreen.preventAutoHideAsync();

function GlobalPlayer() {
		const pathname = usePathname();
		
		// On cache complètement le lecteur si l'utilisateur est sur l'écran de connexion
		if (pathname === '/login') return null;

		// On détecte les pages qui N'ONT PAS le menu de navigation (TabBar)
		const noTabBarRoutes = ['/login', '/edit-profile', '/live'];
		const hasTabBar = !noTabBarRoutes.some(route => pathname?.startsWith(route));
		
		// Si la TabBar est là, on décale le lecteur au-dessus (95px). Sinon, on le colle en bas (30px).
		const bottomOffset = hasTabBar ? 95 : 30;

		// pointerEvents="box-none" empêche cette vue de bloquer les clics, tout en laissant la PlayerBar cliquable
		return (
				<View style={{ position: 'absolute', bottom: bottomOffset, left: 0, right: 0 }} pointerEvents="box-none">
						<PlayerBar />
				</View>
		);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		Fredoka_400Regular,
		Fredoka_500Medium,
		Fredoka_600SemiBold,
		Fredoka_700Bold,
	});

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	return (
		<PlayerProvider>
			<View style={{ flex: 1 }}>
				<Stack screenOptions={{ headerShown: false }} />
				
				<GlobalPlayer />
				
			</View>
		</PlayerProvider>
	);
}