# Export-TAO

**Version: 02-10-2024**

---

## Table des matières

1. [Introduction](#introduction)
2. [Préparation des fichiers](#préparation-des-fichiers)
3. [Exportation](#exportation)
4. [Support](#support)
5. [Info Technique](#info-technique)

---

## Introduction

Ce document a pour vocation de vous guider dans l'utilisation de la plateforme d'export de test TAO. Le site supporte les questions ouvertes et les questions fermées.

Cette application est destinée à l'équipe testing du SPF Finances. Aucune modification ne sera apportée pour se conformer à des cas d'utilisation autres que ceux de l'équipe de testing du SPF Finances.

---

## Préparation des fichiers

### Étape 1 : Exporter un examen ou des questions

1. Rendez-vous sur **TAO** et sélectionnez l'examen ou le dossier contenant les questions que vous souhaitez exporter en PDF.
2. Cliquez sur le bouton **Exporter** qui se trouve en bas à gauche de votre écran.
3. Un menu va apparaître sur la droite et vous pouvez passer à l'étape suivante.

![Placeholder: Screenshot of TAO interface showing the Export button location - TODO: Add image here]

### Étape 2 : Sélection du type d'export

1. Vérifiez que le type d'export est **QTI Examen 2.2**
2. Cliquez ensuite sur **Exporter**.
3. Si le téléchargement démarre directement, vous pouvez directement passer à l'étape suivante.

![Placeholder: Screenshot of export type selection - TODO: Add image here]

> **Si le téléchargement NE démarre PAS**, vous devez attendre que l'export soit traité. Vous pouvez consulter son statut dans le coin supérieur droit dans l'interface de TAO. Une fois la tâche terminée vous pouvez cliquer sur l'icône de sauvegarde.

- La tâche n'est pas encore terminée et est en cours de traitement.
- La tâche est terminée et vous pouvez cliquer sur l'icône de téléchargement

---

## Exportation

### Étape 1 : Configuration

1. Rendez-vous sur le site suivant : **Export-TAO**
2. Cliquez ensuite sur **Parcourir** et sélectionnez le fichier zip de l'étape précédente.
3. Le site va automatiquement générer les questions et les affichera sur le côté droit de la page.
4. Vous pouvez ensuite utiliser les différentes options pour configurer l'export comme vous le souhaitez :

| Option | Description |
|--------|-------------|
| **Answer** | Afficher/Cacher les réponses |
| **Instruction** | Afficher/Cacher les instructions |
| **Letter** | Liste à puces / Liste alphabétique |
| **Compare** | Comparaison visuelle de deux tests |
| **Inzage** | Mode examen - réponses soulignées |
| **Sort question** | Trier les questions par titre |
| **Randomize** | Mélanger les questions/réponses |
| **Zoom** | Changer la taille des éléments affichés |
| **Multiple Files** | Charger plusieurs fichiers |
| **Merge Files** | Fusionner plusieurs exams |
| **Get PDF** | Ouvre la fenêtre d'impression |
| **Show/Hide** | Cacher individuellement des questions ou changer leur ordre |

![Placeholder: Screenshot of Export-TAO interface with all options - TODO: Add image here]

### Étape 2 : Création du PDF

Finalisez la configuration, puis cliquez sur **Get PDF**. Ce bouton ouvrira une fenêtre d'impression. À partir de ce menu, vous devrez choisir soit d'imprimer, soit d'exporter au format PDF selon vos besoins.

---

## Support

Le site **Export-TAO** n'est en aucun cas lié à TAO, au SPF Stratégie & Appui ou au SPF Finances. Merci de ne pas contacter le support technique de ces organisations, mais veuillez plutôt contacter **Benoit Welsch (MINFIN)** sur Teams ou utiliser ces adresses e-mail :

- benoitwelsch@minfin.fed.be
- main@lv0.eu

---

## Info Technique

| | |
|---|---|
| **Lien du site** | https://export.tao.lv0.eu/ |
| **Développeur** | Benoit Welsch |
| **Email** | benoitwelsch@minfin.fed.be |
| **Hébergement** | Cloudflare |
| **Frontend** | Svelte |
| **Repository** | [SPF-Open/Tao_export](https://github.com/SPF-Open/Tao_export) |

### Confidentialité

Le site ne stocke aucun fichier et ne sauvegarde aucune trace de son utilisation. Tout traitement de données est effectué côté client et aucune information confidentielle ne transite par les serveurs de Cloudflare.

Cloudflare s'occupe seulement de rendre les fichiers HTML, CSS et JS publics et accessibles.

Le site est entièrement Open-Source et est disponible sur GitHub.
