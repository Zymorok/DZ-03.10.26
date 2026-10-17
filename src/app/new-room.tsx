import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";

export default function NewRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createRoom = useMutation(api.rooms.createRoom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const id = await createRoom({
        title,
        description: description.trim() || undefined,
      });
      router.replace(`/chat/${id}`);
    } catch {
      setError("Не вдалося створити кімнату. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <View className="flex-row items-center justify-between p-4 border-b border-surfaceLight">
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          className="py-2"
        >
          <Text className="text-grey">Скасувати</Text>
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Нова кімната</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={create}
          disabled={!title.trim() || saving}
          className="py-2"
        >
          <Text
            style={{
              color: title.trim() && !saving ? COLORS.primary : COLORS.grey,
            }}
          >
            {saving ? "Збереження..." : "Створити"}
          </Text>
        </TouchableOpacity>
      </View>
      <View className="p-5 gap-3">
        <Text className="text-white">Назва кімнати</Text>
        <TextInput
          accessibilityLabel="Назва кімнати"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholder="Наприклад, PV411"
          placeholderTextColor={COLORS.grey}
          className="bg-surface border border-surfaceLight rounded-xl px-4 py-3 text-white"
        />
        <Text className="text-white mt-3">Опис (необов’язково)</Text>
        <TextInput
          accessibilityLabel="Опис кімнати"
          value={description}
          onChangeText={setDescription}
          maxLength={300}
          multiline
          placeholder="Про що спілкуємося"
          placeholderTextColor={COLORS.grey}
          className="bg-surface border border-surfaceLight rounded-xl px-4 py-3 text-white"
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        {error ? <Text className="text-red-400">{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
