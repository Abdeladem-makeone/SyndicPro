
# 🏢 SyndicPro Manager v4.0

![Version](https://img.shields.io/badge/version-4.0.0-indigo)
![React](https://img.shields.io/badge/React-19-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![AI](https://img.shields.io/badge/AI-Gemini_3_Pro-orange)

**SyndicPro Manager** est une solution logicielle "Premium" de gestion de copropriété conçue pour moderniser la relation entre le syndic et les propriétaires. L'application combine une gestion financière rigoureuse avec des outils de communication intelligents et une analyse prédictive propulsée par l'intelligence artificielle.

---

## ✨ Fonctionnalités Clés

### 🛡️ Administration (Espace Syndic)
*   **Tableau de Bord Holistique** : Visualisation en temps réel des flux de trésorerie, taux de recouvrement et alertes d'impayés via des graphiques interactifs (Recharts).
*   **Gestion du Patrimoine** : Configuration dynamique de la structure de l'immeuble (étages, unités, millièmes).
*   **Intelligence Financière** : 
    *   **Analyse IA** : Intégration de **Google Gemini 3 Pro** pour générer des audits financiers automatiques et des recommandations budgétaires.
    *   **Journal des Dépenses** : Suivi catégorisé avec possibilité d'exclure certaines dépenses des bilans officiels.
    *   **Revenus des Biens** : Gestion des revenus annexes (antennes GSM, locations, affichage publicitaire).
*   **Centre de Rappels Intelligent** : 
    *   Génération de messages WhatsApp personnalisés (Arabe/Français).
    *   Distinction entre rappels simples et rappels détaillés (cumul d'impayés).
*   **Reporting PDF Haute Qualité** : Génération de Bilans Annuels et États de Caisse professionnels via `jsPDF`.

### 👤 Transparence (Espace Propriétaire)
*   **Tableau de Bord de Transparence** : Accès direct à l'état de la caisse commune pour une gestion sans opacité.
*   **Suivi des Cotisations** : Calendrier visuel des paiements personnels année par année.
*   **Profil & Sécurité** : Authentification via OTP simulé et système de demande de modification de coordonnées avec validation par l'admin.

### 🛠️ Vie de Copropriété (Collaboratif)
*   **Suivi & Projets** : Soumission d'idées d'amélioration avec gestion de budget et priorité.
*   **Gestion des Incidents** : Signalement technique (plaintes) avec **pièces jointes photos** et suivi d'état (Ouvert, En cours, Résolu).

---

## 🚀 Stack Technique

*   **Frontend** : [React 19](https://react.dev/) (Hooks avancés, Context, Architecture modulaire).
*   **Styling** : [Tailwind CSS](https://tailwindcss.com/) avec un design "Glassmorphism" et "Skeuomorphism" moderne.
*   **Intelligence Artificielle** : [@google/genai](https://www.npmjs.com/package/@google/genai) (Modèle Gemini-3-Pro-Preview).
*   **Visualisation** : [Recharts](https://recharts.org/) pour les analyses de données.
*   **Génération de Documents** : [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) & [jspdf-autotable](https://github.com/simonbengtsson/jspdf-autotable).
*   **Stockage** : Persistance locale robuste (`LocalStorage`) avec système d'export/import JSON pour les sauvegardes physiques.

---

## 📦 Structure du Projet

```text
src/
├── components/         # Composants UI réutilisables (Layout, StatCard, Modals)
├── pages/              # Vues principales de l'application
│   ├── Dashboard.tsx   # Dashboard Admin
│   ├── FollowUp.tsx    # Projets & Réclamations (Multi-rôles)
│   ├── Payments.tsx    # Grille de suivi des cotisations
│   └── ...
├── services/           # Logique API et Intégration IA (GeminiService)
├── utils/              # Helpers (Export PDF, WhatsApp, Storage, Notifications)
├── types.ts            # Définitions TypeScript strictes
└── constants.tsx       # Données initiales et configurations thématiques
```

---

## 🛠️ Installation et Configuration

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/votre-compte/syndicpro-manager.git
   ```

2. **Configuration de l'IA** :
   L'application utilise l'API Gemini. Assurez-vous d'avoir une clé API valide.
   *   L'application récupère la clé via `process.env.API_KEY`.

3. **Lancer l'application** :
   Ouvrez `index.html` dans votre navigateur ou utilisez un serveur de développement (Vite/Live Server).

---

## 📋 Informations de Connexion (Démo)

*   **Administrateur** : 
    *   Identifiant : `admin`
    *   Mot de passe : `admin`
*   **Propriétaire** : 
    *   Sélectionnez un appartement dans la liste.
    *   Saisissez le numéro de téléphone correspondant (renseigné dans l'annuaire).

---

## 🔒 Sécurité et Confidentialité

*   **Zero-Backend** : Toutes les données sont stockées localement sur le navigateur de l'utilisateur. Aucune donnée sensible ne transite par un serveur tiers (hormis les agrégats financiers anonymisés envoyés à Gemini pour analyse).
*   **Sauvegarde** : Un système d'export complet au format `.json` permet de transférer ou de sauvegarder les données manuellement.

---

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
*Développé avec ❤️ pour simplifier la gestion immobilière.*
