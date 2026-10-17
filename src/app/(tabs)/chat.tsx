import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";

export default function ChatRoomsScreen() {
  const router = useRouter();
  const rooms = useQuery(api.rooms.listRooms);
  return (
    <View className="flex-1 bg-black">
      <View className="flex-row justify-between items-center p-5 border-b border-surfaceLight">
        <View>
          <Text className="text-white text-2xl font-bold">Чати Prostir</Text>
          <Text className="text-grey text-sm mt-1">
            Спілкуйтеся та діліться фотографіями
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Нова кімната"
          onPress={() => router.push("/new-room")}
          className="p-2"
        >
          <Ionicons
            name="add-circle-outline"
            size={32}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>
      {rooms === undefined ? (
        <ActivityIndicator className="mt-10" color={COLORS.primary} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(room) => room._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          ListEmptyComponent={
            <Text className="text-grey text-center mt-10">
              Кімнат поки немає. Створіть першу.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(`/chat/${item._id}`)}
              className="rounded-2xl bg-surface border border-surfaceLight p-4 mb-3"
            >
              <Text
                className="text-white text-lg font-semibold"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text className="text-grey text-sm mt-1" numberOfLines={1}>
                  {item.description}
                </Text>
              ) : null}
              <Text className="text-grey text-sm mt-3" numberOfLines={1}>
                {item.lastMessage ?? "Повідомлень немає"}
              </Text>
              {item.lastMessageAt ? (
                <Text className="text-grey text-xs mt-2">
                  {new Date(item.lastMessageAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
