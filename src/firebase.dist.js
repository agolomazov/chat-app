import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';
// Initialize Firebase
const config = {
	apiKey: 'your app key',
	authDomain: 'your app domain',
	databaseURL: 'your app domain',
	projectId: 'your project domain',
	storageBucket: 'your project storage bucket',
	messagingSenderId: 'your message sender id',
};
firebase.initializeApp(config);

export default firebase;

/*
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/
