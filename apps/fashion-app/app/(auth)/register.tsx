import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const BG_IMAGE = 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    setLoading(false);
    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Success', 'Registration successful! You are now logged in.');
      router.replace('/(tabs)');
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGE }} className="flex-1 w-full h-full" resizeMode="cover">
      <View className="flex-1 bg-black/60">
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 justify-center px-6"
          >
            <View className="mb-6 mt-8 items-center">
              <Text className="text-4xl font-extrabold text-white tracking-widest uppercase mb-2">Vogue</Text>
              <Text className="text-white/70 text-center tracking-wider">Join the fashion revolution</Text>
            </View>

            <View className="bg-white/10 rounded-3xl p-6 border border-white/20">
              <Text className="text-2xl font-bold text-white mb-6 text-center">Create Account</Text>

              <View className="space-y-4">
                <View>
                  <View className="flex-row items-center bg-black/40 rounded-xl px-4 h-14 border border-white/10">
                    <Ionicons name="person-outline" size={20} color="#ccc" className="mr-3" />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base h-full"
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center bg-black/40 rounded-xl px-4 h-14 border border-white/10 mt-4">
                    <Ionicons name="mail-outline" size={20} color="#ccc" className="mr-3" />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base h-full"
                      placeholder="Email address"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View>
                  <View className="flex-row items-center bg-black/40 rounded-xl px-4 h-14 border border-white/10 mt-4">
                    <Ionicons name="lock-closed-outline" size={20} color="#ccc" className="mr-3" />
                    <TextInput
                      className="flex-1 text-white ml-3 text-base h-full"
                      placeholder="Create a password"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  className="w-full bg-primary rounded-xl h-14 items-center mt-8 flex-row justify-center shadow-lg"
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg tracking-wide">Sign Up</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-center mt-8">
                <Text className="text-white/60">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary font-bold">Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
