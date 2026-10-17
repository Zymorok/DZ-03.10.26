import { Image, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

export function ImageViewerModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!imageUrl} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-black">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Закрити фото"
          onPress={onClose}
          className="self-end p-4"
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        {imageUrl ? (
          <Image
            accessibilityLabel="Фото на весь екран"
            source={{ uri: imageUrl }}
            resizeMode="contain"
            style={{ flex: 1, width: "100%" }}
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
