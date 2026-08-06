// ~/@cores/constants/translations.ts

import messagesFr from "~/translations/locales/fr/index";
import messagesEn from "~/translations/locales/en/index";
import messagesIt from "~/translations/locales/it/index";

import oldMessagesFr from "~/translations/locales/fr";
import oldMessagesEn from "~/translations/locales/en";
import oldMessagesIt from "~/translations/locales/it";

import type { Language, LanguagesMap } from '~/types/translations'
// import en from "~/assets/images/flag/icon-flag-en.svg";
// import fr from "~/assets/images/flag/icon-flag-fr.svg";
// import it from "~/assets/images/flag/icon-flag-it.svg";

export const LOCALE_FR = "fr";
export const LOCALE_EN = "en";
export const LOCALE_IT = "it";
export const DEFAULT_LOCALE = LOCALE_FR;

export const ALL_LANGUAGES : LanguagesMap = {
    [LOCALE_FR] : {
        name : "Français",
        // image : fr,
        icon : "fa-regular fa-globe",
        slug: LOCALE_FR,
        staticMessages : {
            ...messagesFr,
            ...oldMessagesFr
        },
    },
    [LOCALE_EN] : {
        name : "Anglais",
        // image : en,
        icon : "fa-regular fa-globe",
        slug: LOCALE_EN,
        staticMessages : {
            ...messagesEn,
            ...oldMessagesEn,
        },
    },
    [LOCALE_IT] : {
        name : "Italien",
        // image : it,
        icon : "fa-regular fa-globe",
        slug: LOCALE_IT,
        staticMessages : {
            ...messagesIt,
            ...oldMessagesIt,
        },
    }
};

export const staticMessages = Object.fromEntries(
                                    Object.entries(ALL_LANGUAGES)
                                        .map(([locale, { staticMessages }]) => [
                                            locale,
                                            { ...staticMessages },
                                        ])
                                );

export const SUPPORTED_LOCALES = Object.keys(ALL_LANGUAGES);