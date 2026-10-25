import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

export default function BottomNavBar({
  activeTab = 'home',
  onTabPress,
  currentUser = null,
}) {
  const tabs = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'orders', label: 'My Orders', icon: '📦' },
    { key: 'services', label: 'Services', icon: '🛠️' },
    {
      key: 'account',
      label: currentUser ? 'Account' : 'Sign In',
      icon: currentUser ? '👤' : '🔐',
    },
  ];

  return (
    <View style={styles.navContainer}>
      <View style={styles.navInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.iconContainer}>
                <Text
                  style={[
                    styles.tabIcon,
                    isActive && styles.tabIconActive,
                  ]}
                >
                  {tab.icon}
                </Text>
                {tab.key === 'account' && currentUser && (
                  <View style={styles.userActiveDot} />
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 40,
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.65,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#0284c7',
    fontWeight: '800',
  },
  userActiveDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
});
