import { Text, View } from "react-native";

export function ChatProfileStats({ stats, createdAt }: {
  stats: { messagesCount: number; roomsCreatedCount: number };
  createdAt: number;
}) {
  return (
    <View className="mb-4 gap-3">
      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface rounded-xl p-3 items-center">
          <Text className="text-primary font-bold text-xl">{stats.messagesCount}</Text>
          <Text className="text-grey text-xs">Повідомлень</Text>
        </View>
        <View className="flex-1 bg-surface rounded-xl p-3 items-center">
          <Text className="text-primary font-bold text-xl">{stats.roomsCreatedCount}</Text>
          <Text className="text-grey text-xs">Створено кімнат</Text>
        </View>
      </View>
      <Text className="text-grey text-xs">У Prostir з {new Date(createdAt).toLocaleDateString("uk-UA")}</Text>
    </View>
  );
}
