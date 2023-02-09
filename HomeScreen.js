/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

 import React, { Component } from 'react';
 import {
   StyleSheet,
   Text,
   Button,
   View,
   NativeModules
 } from 'react-native';
 import { startVideoScreen } from 'vdocipher-rn-bridge';
 
 type Props = {};
 export default class HomeScreen extends Component<Props> {
   constructor(props) {
     super(props);
     console.log('HomeScreen contructor');
     this.state = {};
   }
 
   componentDidMount() {
     console.log('HomeScreen did mount');
     fetch("https://dev.vdocipher.com/api/site/homepage_video")
       .then(res => res.json())
       .then(resp => this.setState({otp: resp.otp, playbackInfo: resp.playbackInfo}));
   }
 
   componentWillUnmount() {
     console.log('HomeScreen will unmount');
   }
 
   render() {
     var ready = this.state.otp != null;
     const { otp, playbackInfo } = this.state;
     const embedInfo = { otp, playbackInfo, setPictureInPictureSupport: true };
     return (
       <View style={styles.container}>
         <Text style={styles.welcome}>
           Welcome to VdoCipher react-native integration!
         </Text>
         <View style={styles.buttonContainer}>
           <Button
             disabled={!ready}
             title={ready ? "Start video in native fullscreen" : "Loading..."}
             onPress={
               () => startVideoScreen({embedInfo})
             }
           />
         </View>
         <View style={styles.buttonContainer}>
           <Button
             disabled={!ready}
             title={ready ? "Start video with embedded native controls" : "Loading..."}
             onPress={
               () => this.props.navigation.navigate('NativeControls', {embedInfo})
             }
           />
         </View>
         <View style={styles.buttonContainer}>
           <Button
             disabled={!ready}
             title={ready ? "Start video with JS controls" : "Loading..."}
             onPress={
               () => this.props.navigation.navigate('JSControls', {embedInfo})
             }
           />
         </View>
         <View style={styles.buttonContainer}>
          <Button
            title='Downloads'
            onPress={
              () => this.props.navigation.navigate('Downloads')
            }
          />
        </View>
        {/* This button is used to show how to open player in new activity so that when player 
        goes in pip mode, the previous activity(screen) is still visible/browsable */}
        <View style={styles.buttonContainer}>
          <Button
            title='Open Player in new Activity'
            onPress={
              () => NativeModules.PlayerActivityM.openPlayerActivity()
            }
          />
        </View>
       </View>
     );
   }
 }
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     alignItems: 'center',
     backgroundColor: '#F5FCFF',
   },
   welcome: {
     fontSize: 20,
     textAlign: 'center',
     margin: 20,
   },
   buttonContainer: {
     margin: 20,
   },
 });
 