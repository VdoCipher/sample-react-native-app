/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

 import React from 'react';
 import { NavigationContainer } from '@react-navigation/native';
 import { createNativeStackNavigator } from '@react-navigation/native-stack';
 
 import HomeScreen from './HomeScreen';
 import NativeControlsScreen from './NativeControlsScreen';
 import JSControlsScreen from './JSControlsScreen';
 import DownloadsScreen from './DownloadsScreen';
 import {enableScreens} from 'react-native-screens';
 enableScreens();
 
 const Stack = createNativeStackNavigator();
 
 
 export default function App() {
   return (
     <NavigationContainer>
     <Stack.Navigator initialRouteName="Home">
       <Stack.Screen name="Home" component={HomeScreen} options={{headerShown:false}}/>
       <Stack.Screen name="NativeControls" component={NativeControlsScreen} options={{headerShown:false}}/>
       <Stack.Screen name="JSControls" component={JSControlsScreen} options={{headerShown:false}}/>
       <Stack.Screen name="Downloads" component={DownloadsScreen} options={{headerShown:false}}/>
     </Stack.Navigator>
     </NavigationContainer>
   );
 }