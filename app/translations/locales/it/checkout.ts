export default {
    steps: {
        contact: 'Contatto',
        address: 'Indirizzo',
        finalize: 'Conferma'
    },

    step1: {
        title: 'Chi sei?',
        subtitle: 'Ci serve per organizzare la tua consegna.',
        firstName: 'Nome',
        lastName: 'Cognome',
        email: 'Email',
        phone: 'Telefono'
    },

    step2: {
        title: 'Dove consegnare?',
        subtitle: 'Controlla bene l\u2019indirizzo, \u00e8 l\u00ec che arriver\u00e0.',
        address: 'Indirizzo',
        city: 'Citt\u00e0',
        postalCode: 'CAP',
        country: 'Paese',
        countries: {
            it: 'Italia',
            fr: 'Francia',
            be: 'Belgio',
            ch: 'Svizzera',
            es: 'Spagna'
        }
    },

    step3: {
        title: 'Finalizza il tuo ordine',
        subtitle: 'Consegna, pagamento e riepilogo.',
        daysRange: '{min}-{max} giorni lavorativi',
        free: 'Gratis',
        loadError: 'Impossibile caricare i metodi di consegna. Controlla la connessione e riprova.',
        retry: 'Riprova',
        noMethodsAvailable: 'Nessun metodo di consegna disponibile per questo indirizzo al momento.'
    },

    step4: {
        title: 'Riepilogo',
        subtitle: 'Ultimo controllo prima di confermare.',
        deliverTo: 'Consegna a',
        subtotal: 'Subtotale',
        shipping: 'Spedizione',
        shippingFree: 'Gratuita',
        total: 'Totale',
        genericError: 'Impossibile confermare l\u2019ordine. Riprova.',
        unexpectedError: 'Si \u00e8 verificato un errore. Riprova tra poco.',
        paymentSectionLabel: 'Metodo di pagamento',
        paymentMethodRequired: 'Seleziona un metodo di pagamento per continuare.',
        itemsCount: '{count} articolo | {count} articoli',
        bankTransferPreviewNote: 'I dati bancari completi e il riferimento da indicare appariranno subito dopo la conferma del tuo ordine.'
    },

    footer: {
        continue: 'Continua',
        payAmount: 'Paga {amount}\u20ac',
        secure: 'Pagamento sicuro al 100%'
    },

    validation: {
        firstNameRequired: 'Nome richiesto',
        lastNameRequired: 'Cognome richiesto',
        emailInvalid: 'Email non valida',
        emailRequired: 'Email richiesta',
        phoneRequired: 'Telefono richiesto',
        addressRequired: 'Indirizzo richiesto',
        cityRequired: 'Citt\u00e0 richiesta',
        postalCodeRequired: 'CAP richiesto',
        countryRequired: 'Paese richiesto'
    },

    bankCard: {
        title: 'Coordinate bancarie',
        beneficiary: 'Beneficiario',
        amount: 'Importo',
        reference: 'Riferimento da indicare',
        copyAll: 'Copia tutte le informazioni',
        copiedAll: 'Informazioni copiate!',
        referenceWarning: 'Non dimenticare di indicare il riferimento nella causale del bonifico: senza di esso non possiamo identificare il tuo ordine.'
    }
}