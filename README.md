# CarRent - Application de location de voitures

## 1. Présentation du projet
CarRent est une application mobile de location de voitures développée avec React Native et Firebase. Elle permet aux utilisateurs de rechercher, réserver et publier des véhicules en quelques clics.  
**Public cible** : jeunes actifs urbains et agences de location au Maroc.

## 2. Membres de l'équipe
- **IYMANE BOLAKHRIF** – Scrum Master : Structure GitHub, estimation COCOMO, authentification Firebase.
- **HAJAR OUSAID** – Product Owner : Diagramme de Gantt, rédaction du README, conventions des commits.
- **KHAOULA EL MAATAOUI** – Développeuse : Mini-CDC, tests unitaires, gestion des réservations.
- **ACHRAF ABBADI** – Développeur : WBS, déploiement, configuration de la base de données.

## 3. Technologies utilisées
- **Framework mobile** : React Native (Expo)
- **Backend** : Firebase (Authentication, Realtime Database, Storage)
- **Langage** : JavaScript

## 4. Prérequis d'installation
- Node.js 18 ou supérieur
- npm ou yarn
- Expo CLI
- Compte Firebase (gratuit)

## 5. Instructions de lancement
1. Cloner le dépôt :  
   `git clone https://github.com/iymane6543/G3-CarRent.git`
2. Accéder au dossier :  
   `cd G3-CarRent`
3. Installer les dépendances :  
   `npm install`
4. Lancer l'application :  
   `npx expo start --web`
5. Sur mobile : scanner le QR code avec l'application **Expo Go**.

## 6. URL de déploiement
L'application n'est actuellement pas déployée en ligne. Elle fonctionne localement via Expo.  
Un déploiement est possible avec **EAS Build** (Expo Application Services) pour générer un fichier APK (Android) ou IPA (iOS).

## 7. Identifiants de test
- **Adresse e-mail** : `demo@carrent.com`
- **Mot de passe** : `123456`

## 8. Livrables antérieurs
- [Cahier des Charges](docs/CDC.pdf)
- [WBS et Diagramme de Gantt](docs/WBS-Gantt.pdf)
- [Product Backlog](docs/Backlog.pdf)

## 9. Bonus - Docker
Pour lancer les émulateurs Firebase localement :
```bash
docker-compose up
