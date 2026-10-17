// src/components/EditProfileModal.tsx
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { fetch } from "expo/fetch";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    fullname?: string;
    username?: string;
    bio?: string;
    image?: string;
  };
}

export function EditProfileModal({
  visible,
  onClose,
  user,
}: EditProfileModalProps) {
  const [fullname, setFullname] = useState(user.fullname ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const selectedImageUri = selectedImage?.uri;
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Скидаємо/синхронізуємо стан форми з актуальними даними користувача при відкритті вікна

  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  // Функція вибору зображення з галереї
  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Функція зйомки нового фото з камери
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Потрібен доступ",
        "Надайте додатку дозвіл на використання камери у налаштуваннях пристрою",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Головний селектор вибору джерела фото
  const pickImage = () => {
    if (Platform.OS === "web") { void pickImageFromLibrary(); return; }
    Alert.alert("Оберіть дію", "Оберіть джерело для фото профілю", [
      {
        text: "Зробити фото",
        onPress: takePhoto,
      },
      {
        text: "Обрати з галереї",
        onPress: pickImageFromLibrary,
      },
      {
        text: "Скасувати",
        style: "cancel",
      },
    ]);
  };

  const handleSave = async () => {
    setErrorText("");
    if (!fullname.trim()) { setErrorText("Введіть ім’я."); return; }
    if (selectedImage && (selectedImage.fileSize ?? 0) > 10 * 1024 * 1024) { setErrorText("Оберіть зображення розміром до 10 МБ."); return; }
    try {
      setIsSubmitting(true);

      let imageStorageId = undefined;

      // Якщо користувач обрав новий аватар — завантажуємо через expo-file-system та expo/fetch
      if (selectedImageUri) {
        const uploadUrl = await generateUploadUrl();
        const file = Platform.OS === "web"
          ? (selectedImage?.file ?? await (await fetch(selectedImageUri)).blob())
          : new File(selectedImageUri);

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage?.mimeType || file.type || "image/jpeg" },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error("Не вдалося завантажити зображення на сервер");
        }

        const json = await uploadResult.json();
        imageStorageId = json.storageId;
      }

      await updateUserProfile({
        fullname,
        username,
        bio,
        imageStorageId,
      });

      setSelectedImage(null);
      onClose();
    } catch (error) {
      console.error("Помилка збереження профілю:", error);
      setErrorText(error instanceof Error ? error.message.replace(/^[\s\S]*?Uncaught Error: /, "").split("\n")[0] : "Не вдалося зберегти зміни профілю.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <View className="bg-surface border-t border-surfaceLight rounded-t-3xl p-5 max-h-[88%]">
          {/* Хедер модального вікна */}
          <View className="flex-row items-center justify-between pb-4 border-b border-surfaceLight">
            <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
              <Text className="text-grey text-base">Скасувати</Text>
            </TouchableOpacity>

            <Text className="text-white font-bold text-base" style={{ flexShrink: 1, textAlign: "center", marginHorizontal: 8 }}>
              Редагувати профіль
            </Text>

            <TouchableOpacity onPress={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text className="text-primary font-bold text-base">
                  Зберегти
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="pt-4">
            {errorText ? <Text accessibilityLiveRegion="polite" className="text-red-400 mb-3">{errorText}</Text> : null}
            {/* Аватар та кнопка зміни */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={pickImage}
                disabled={isSubmitting}
                className="relative active:opacity-80"
              >
                {selectedImageUri || user.image ? (
                  <Image
                    source={{
                      uri: selectedImageUri || user.image,
                    }}
                    className="w-24 h-24 rounded-full border-2 border-primary"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-surfaceLight items-center justify-center border-2 border-surfaceLight">
                    <Ionicons name="person" size={44} color={COLORS.grey} />
                  </View>
                )}

                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-surface">
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickImage} className="mt-2">
                <Text className="text-primary text-sm font-semibold">
                  Змінити фото профілю
                </Text>
              </TouchableOpacity>
            </View>

            {/* Поля вводу */}
            <View className="gap-4 pb-10">
              <View>
                <Text className="text-grey text-xs font-semibold mb-1.5 uppercase">
                  {"Повне ім'я"}
                </Text>
                <TextInput
                  accessibilityLabel="Повне ім’я"
                  maxLength={100}
                  value={fullname}
                  onChangeText={setFullname}
                  placeholder="Введіть повне ім'я..."
                  placeholderTextColor={COLORS.grey}
                  className="bg-black text-white px-4 py-3 rounded-xl border border-surfaceLight text-base"
                />
              </View>

              <View>
                <Text className="text-grey text-xs font-semibold mb-1.5 uppercase">
                  {"Ім'я користувача"}
                </Text>
                <TextInput
                  accessibilityLabel="Нікнейм"
                  maxLength={31}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="username"
                  placeholderTextColor={COLORS.grey}
                  className="bg-black text-white px-4 py-3 rounded-xl border border-surfaceLight text-base"
                />
              </View>

              <View>
                <Text className="text-grey text-xs font-semibold mb-1.5 uppercase">
                  Про себе (Bio)
                </Text>
                <TextInput
                  accessibilityLabel="Про себе"
                  maxLength={300}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholder="Розкажіть про себе..."
                  placeholderTextColor={COLORS.grey}
                  textAlignVertical="top"
                  className="bg-black text-white px-4 py-3 rounded-xl border border-surfaceLight text-base h-28"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
