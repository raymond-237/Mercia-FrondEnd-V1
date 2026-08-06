export default {
    steps: {
        contact: 'Contact',
        address: 'Adresse',
        finalize: 'Finaliser'
    },

    step1: {
        title: 'Qui êtes-vous ?',
        subtitle: 'On en a besoin pour organiser ta livraison.',
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone'
    },

    step2: {
        title: 'Où livrer ?',
        subtitle: 'Vérifie bien l\u2019adresse, c\u2019est là que ça arrive.',
        address: 'Adresse',
        city: 'Ville',
        postalCode: 'Code postal',
        country: 'Pays',
        countries: {
            it: 'Italie',
            fr: 'France',
            be: 'Belgique',
            ch: 'Suisse',
            es: 'Espagne'
        }
    },

    step3: {
        // Titre/sous-titre mis à jour — cette étape couvre maintenant
        // livraison ET paiement ET récapitulatif, pas juste la livraison.
        title: 'Finalise ta commande',
        subtitle: 'Livraison, paiement et récapitulatif.',
        daysRange: '{min}-{max} jours ouvrés',
        free: 'Gratuit',
        loadError: 'Impossible de charger les méthodes de livraison. Vérifie ta connexion et réessaie.',
        retry: 'Réessayer',
        noMethodsAvailable: 'Aucune méthode de livraison disponible pour cette adresse pour le moment.'
    },

    step4: {
        title: 'Récapitulatif',
        subtitle: 'Dernière vérification avant de valider.',
        deliverTo: 'Livraison à',
        subtotal: 'Sous-total',
        shipping: 'Livraison',
        shippingFree: 'Gratuite',
        total: 'Total',
        genericError: 'Impossible de valider la commande. Réessaie.',
        unexpectedError: 'Une erreur est survenue. Réessaie dans un instant.',
        // Manquantes — utilisées dans checkout.vue mais absentes du fichier
        paymentSectionLabel: 'Moyen de paiement',
        paymentMethodRequired: 'Sélectionne un moyen de paiement pour continuer.',
        itemsCount: '{count} article | {count} articles',
        bankTransferPreviewNote: 'Les coordonnées bancaires complètes et la référence à indiquer apparaîtront juste après validation de ta commande.'
    },

    footer: {
        continue: 'Continuer',
        payAmount: 'Payer {amount}€',
        secure: 'Paiement 100% sécurisé'
    },

    validation: {
        firstNameRequired: 'Prénom requis',
        lastNameRequired: 'Nom requis',
        emailInvalid: 'Email invalide',
        emailRequired: 'Email requis',
        phoneRequired: 'Téléphone requis',
        addressRequired: 'Adresse requise',
        cityRequired: 'Ville requise',
        postalCodeRequired: 'Code postal requis',
        countryRequired: 'Pays requis'
    },

    bankCard: {
        title: 'Coordonnées bancaires',
        beneficiary: 'Bénéficiaire',
        amount: 'Montant',
        reference: 'Référence à indiquer',
        copyAll: 'Copier toutes les informations',
        copiedAll: 'Informations copiées !',
        referenceWarning: 'N\u2019oubliez pas d\u2019indiquer la référence dans le motif du virement — sans elle, nous ne pouvons pas identifier votre commande.'
    }
}