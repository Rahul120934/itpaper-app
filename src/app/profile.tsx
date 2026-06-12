import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, AlertTriangle, Key, Mail, Lock, LogOut, Terminal, BookOpen, ExternalLink, Globe } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setCheckingSession(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setCheckingSession(false);
    }
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      Alert.alert('Success', 'Logged in successfully!');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      // Show a generic message — do not leak raw Supabase error details to UI
      const msg = error?.message?.includes('Invalid login')
        ? 'Invalid email or password. Please try again.'
        : 'Authentication failed. Please check your credentials and try again.';
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    // Enforce minimum password length for new accounts
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    if (!isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      
      if (data.user && data.session === null) {
        Alert.alert('Success', 'Signup complete! Please check your email inbox for confirmation link.');
      } else {
        Alert.alert('Success', 'Registered and logged in successfully!');
      }
      setEmail('');
      setPassword('');
    } catch (error: any) {
      // Show a generic message — do not leak raw Supabase error details to UI
      Alert.alert('Registration Failed', 'Could not create your account. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error: any) {
      Alert.alert('Error Signing Out', 'Could not sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Info */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Setup & Profile
            </ThemedText>
            <ThemedText type="small" style={styles.subtitle}>
              Configure your backend databases and sync user states
            </ThemedText>
          </View>

          {/* Connection Status Section */}
          <ThemedView type="backgroundElement" style={styles.statusBox}>
            <View style={styles.statusRow}>
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle size={24} color="#10B981" />
                  <View style={styles.statusTextContainer}>
                    <ThemedText type="default" style={{ color: '#10B981', fontWeight: '600' }}>
                      Connected to Supabase
                    </ThemedText>
                    <ThemedText type="small" style={styles.subStatusText}>
                      App is sync-ready and loading records from Postgres.
                    </ThemedText>
                  </View>
                </>
              ) : (
                <>
                  <AlertTriangle size={24} color="#F59E0B" />
                  <View style={styles.statusTextContainer}>
                    <ThemedText type="default" style={{ color: '#F59E0B', fontWeight: '600' }}>
                      Running in Local Demo Mode
                    </ThemedText>
                    <ThemedText type="small" style={styles.subStatusText}>
                      No environment variables detected. Loading local mock data.
                    </ThemedText>
                  </View>
                </>
              )}
            </View>

            <View style={styles.divider} />

            {/* Connection Credentials Information */}
            <View style={styles.envVarsList}>
              <View style={styles.envVarRow}>
                <ThemedText type="smallBold">URL:</ThemedText>
                <ThemedText type="small" style={styles.envVarVal} numberOfLines={1}>
                  {process.env.EXPO_PUBLIC_SUPABASE_URL ? '•••••••.supabase.co (Configured)' : 'Not Configured (Missing)'}
                </ThemedText>
              </View>
              <View style={styles.envVarRow}>
                <ThemedText type="smallBold">Key:</ThemedText>
                <ThemedText type="small" style={styles.envVarVal} numberOfLines={1}>
                  {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '•••••••••••••••• (Configured)' : 'Not Configured (Missing)'}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Setup Guide (Shown when not configured) */}
          {!isSupabaseConfigured && (
            <View style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>
                How to Connect your Supabase Database
              </ThemedText>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberContainer}>
                  <ThemedText type="smallBold" style={styles.stepNumber}>1</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="smallBold">Create a Database</ThemedText>
                  <ThemedText type="small" style={styles.stepDesc}>
                    Go to supabase.com, create a free project, and navigate to the SQL Editor.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberContainer}>
                  <ThemedText type="smallBold" style={styles.stepNumber}>2</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="smallBold">Apply Schema & Seed Papers</ThemedText>
                  <ThemedText type="small" style={styles.stepDesc}>
                    Open `supabase_schema.sql` at the root of this app, copy its content, paste it in the Supabase SQL editor and run it.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberContainer}>
                  <ThemedText type="smallBold" style={styles.stepNumber}>3</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="smallBold">Configure environment keys</ThemedText>
                  <ThemedText type="small" style={styles.stepDesc}>
                    Open `.env` at the root of this project, paste your Project API URL and Public Anon Key, and save.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepNumberContainer}>
                  <ThemedText type="smallBold" style={styles.stepNumber}>4</ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="smallBold">Reload App server</ThemedText>
                  <ThemedText type="small" style={styles.stepDesc}>
                    Restart your Expo Go terminal: press `r` to reload or start it with `npm run start --clear` to load the new environment variables.
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Authentication Section */}
          {checkingSession ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : isSupabaseConfigured ? (
            user ? (
              // Logged In User profile
              <View style={styles.section}>
                <ThemedText type="default" style={styles.sectionTitle}>
                  User Session
                </ThemedText>
                <ThemedView type="backgroundElement" style={styles.authBox}>
                  <View style={styles.userInfoRow}>
                    <Mail size={18} color={colors.textSecondary} />
                    <ThemedText type="smallBold" style={styles.userEmail}>
                      {user.email}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.userMeta}>
                    User ID: {user.id}
                  </ThemedText>
                  
                  <Pressable
                    onPress={handleSignOut}
                    disabled={loading}
                    style={[styles.button, styles.signOutButton]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <LogOut size={16} color="#ffffff" />
                        <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                          Sign Out
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </ThemedView>
              </View>
            ) : (
              // Auth form to login/register
              <View style={styles.section}>
                <ThemedText type="default" style={styles.sectionTitle}>
                  Sign In or Register
                </ThemedText>
                <ThemedView type="backgroundElement" style={styles.authBox}>
                  <ThemedText type="small" style={styles.authDescription}>
                    Create an account or login to sync your bookmarks in real-time across devices.
                  </ThemedText>
                  
                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSelected }]}>
                    <Mail size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.authInput, { color: colors.text }]}
                      placeholder="Email Address"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSelected }]}>
                    <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.authInput, { color: colors.text }]}
                      placeholder="Password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  <View style={styles.authButtonsRow}>
                    <Pressable
                      onPress={handleSignIn}
                      disabled={loading}
                      style={[styles.button, styles.primaryButton, { flex: 1 }]}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                          Sign In
                        </ThemedText>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={handleSignUp}
                      disabled={loading}
                      style={[styles.button, styles.secondaryButton, { borderColor: colors.text, flex: 1 }]}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <ThemedText type="smallBold" style={{ color: colors.text }}>
                          Register
                        </ThemedText>
                      )}
                    </Pressable>
                  </View>
                </ThemedView>
              </View>
            )
          ) : (
            // Disabled Auth prompt
            <View style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>
                Authentication
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.disabledAuthBox}>
                <Lock size={32} color={colors.textSecondary} style={{ marginBottom: Spacing.two }} />
                <ThemedText type="smallBold" style={{ textAlign: 'center', marginBottom: Spacing.one }}>
                  Auth Unavailable in Local Mode
                </ThemedText>
                <ThemedText type="small" style={{ textAlign: 'center', opacity: 0.6, paddingHorizontal: Spacing.four }}>
                  You must connect to Supabase first to register users and store bookmarks in the cloud database.
                </ThemedText>
              </ThemedView>
            </View>
          )}

          {/* Extra Info */}
          <View style={styles.footerInfo}>
            <View style={styles.metaRow}>
              <Terminal size={14} color={colors.textSecondary} />
              <ThemedText type="small" style={{ opacity: 0.5 }}>
                Built with Expo SDK 56 & Supabase-js
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  statusBox: {
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  statusTextContainer: {
    flex: 1,
  },
  subStatusText: {
    opacity: 0.7,
    marginTop: Spacing.one / 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginVertical: Spacing.two,
  },
  envVarsList: {
    gap: Spacing.one,
  },
  envVarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  envVarVal: {
    flex: 1,
    textAlign: 'right',
    opacity: 0.6,
    fontFamily: 'Courier',
  },
  section: {
    marginTop: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  stepCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepDesc: {
    opacity: 0.7,
    marginTop: 2,
    lineHeight: 16,
  },
  loadingContainer: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  authBox: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    gap: Spacing.three,
  },
  authDescription: {
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  authInput: {
    flex: 1,
    fontSize: 14,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  userEmail: {
    fontSize: 15,
  },
  userMeta: {
    opacity: 0.5,
    fontFamily: 'Courier',
    fontSize: 11,
  },
  disabledAuthBox: {
    padding: Spacing.five,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.1)',
    backgroundColor: 'rgba(128, 128, 128, 0.03)',
  },
  footerInfo: {
    marginTop: Spacing.five,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
