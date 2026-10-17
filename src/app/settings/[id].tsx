import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";

export default function RoomSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const room = useQuery(api.rooms.getRoom, { roomId: id });
  const user = useQuery(api.users.currentUser);
  const deleteRoom = useMutation(api.rooms.deleteRoom);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!room || deleting) return;
    setDeleting(true);
    try {
      await deleteRoom({ roomId: room._id });
      router.replace("/(tabs)/chat");
    } catch {
      setError("Не вдалося видалити кімнату.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <View className="flex-1 bg-black p-5">
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => router.back()}
        className="py-3 self-start"
      >
        <Text className="text-primary">Назад</Text>
      </TouchableOpacity>
      <Text className="text-white text-2xl font-bold my-5">
        Інформація про кімнату
      </Text>
      {room === undefined ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : room === null ? (
        <Text className="text-grey">Кімнату видалено або не знайдено.</Text>
      ) : (
        <View className="gap-4">
          <Text className="text-white text-xl font-semibold">{room.title}</Text>
          {room.description ? (
            <Text className="text-grey">{room.description}</Text>
          ) : null}
          <Text className="text-grey">Автор: {room.creatorName}</Text>
          {user?._id === room.creatorId ? (
            confirming ? (
              <View className="bg-surface p-4 rounded-xl gap-4">
                <Text className="text-white">
                  Видалити кімнату та всі її повідомлення?
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={remove}
                  disabled={deleting}
                >
                  <Text className="text-red-400">
                    {deleting ? "Видалення..." : "Так, видалити кімнату"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setConfirming(false)}
                  disabled={deleting}
                >
                  <Text className="text-grey">Скасувати</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setConfirming(true)}
                className="py-4"
              >
                <Text className="text-red-400">Видалити кімнату</Text>
              </TouchableOpacity>
            )
          ) : null}
          {error ? <Text className="text-red-400">{error}</Text> : null}
        </View>
      )}
    </View>
  );
}
