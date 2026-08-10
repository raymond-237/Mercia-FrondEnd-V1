export default {
    steps: {
        contact: 'Contact',
        address: 'Address',
        finalize: 'Finalize'
    },

    step1: {
        title: 'Who are you?',
        subtitle: 'We need this to arrange your delivery.',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone'
    },

    step2: {
        title: 'Where to deliver?',
        subtitle: 'Double-check the address \u2014 that\u2019s where it\u2019s headed.',
        address: 'Address',
        city: 'City',
        postalCode: 'Postal code',
        country: 'Country',
        countries: {
            it: 'Italy',
            fr: 'France',
            be: 'Belgium',
            ch: 'Switzerland',
            es: 'Spain'
        }
    },

    step3: {
        title: 'Finish your order',
        subtitle: 'Delivery, payment and summary.',
        daysRange: '{min}-{max} business days',
        free: 'Free',
        loadError: 'Couldn\u2019t load delivery methods. Check your connection and try again.',
        retry: 'Retry',
        noMethodsAvailable: 'No delivery method is available for this address right now.'
    },

    step4: {
        title: 'Summary',
        subtitle: 'One last check before you confirm.',
        deliverTo: 'Deliver to',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        shippingFree: 'Free',
        total: 'Total',
        genericError: 'Couldn\u2019t place the order. Please try again.',
        unexpectedError: 'Something went wrong. Please try again in a moment.',
        paymentSectionLabel: 'Payment method',
        paymentMethodRequired: 'Select a payment method to continue.',
        itemsCount: '{count} item | {count} items',
        bankTransferPreviewNote: 'Full bank details and the reference to include will appear right after you confirm your order.'
    },

    footer: {
        continue: 'Continue',
        payAmount: 'Pay {amount}\u20ac',
        secure: '100% secure payment'
    },

    validation: {
        firstNameRequired: 'First name required',
        lastNameRequired: 'Last name required',
        emailInvalid: 'Invalid email',
        emailRequired: 'Email required',
        phoneRequired: 'Phone required',
        addressRequired: 'Address required',
        cityRequired: 'City required',
        postalCodeRequired: 'Postal code required',
        countryRequired: 'Country required'
    },

    bankCard: {
        title: 'Bank details',
        beneficiary: 'Beneficiary',
        amount: 'Amount',
        reference: 'Reference to include',
        copyAll: 'Copy all details',
        copiedAll: 'Details copied!',
        referenceWarning: 'Don\u2019t forget to include the reference in the transfer note \u2014 without it, we can\u2019t identify your order.'
    }
}