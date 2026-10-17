import { Animated, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { COLORS } from "@/constants/theme";

export function TypingDots({ typingUsers }: { typingUsers: string[] }) {
  const [dots] = useState(() => [
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);
  useEffect(() => {
    if (!typingUsers.length) return;
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(dot, {
            toValue: -4,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dots, typingUsers.length]);
  if (!typingUsers.length) return null;
  return (
    <View
      className="flex-row items-center px-4 py-2"
      accessibilityLiveRegion="polite"
    >
      <Text className="text-grey text-xs mr-2">
        {typingUsers.join(", ")}{" "}
        {typingUsers.length === 1 ? "друкує" : "друкують"}
      </Text>
      <View className="flex-row gap-1">
        {dots.map((dot, index) => (
          <Animated.View
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: COLORS.primary,
              transform: [{ translateY: dot }],
            }}
          />
        ))}
      </View>
    </View>
  );
}
