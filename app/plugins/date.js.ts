import { format, parseISO } from 'date-fns';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('formatDate', (dateString:any) => {
    return format(parseISO(dateString), 'dd MMMM yyyy à HH:mm');
  });
});