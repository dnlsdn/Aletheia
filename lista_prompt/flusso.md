**Come funziona il flusso:**

- **Step 0** è uguale per tutti — i primi 30 minuti li passate insieme a scambiarvi i JSON contract. Dev 3 riceve i formati da Dev 1 e Dev 2, li mette nel mock data, e poi lavora completamente in autonomia per le prime 5-6 ore.
- **Dev 1 e Dev 2** lavorano in parallelo senza mai bloccarsi a vicenda. L'unica dipendenza tra loro è che alla fine Dev 3 ha bisogno che entrambi abbiano i backend attivi.
- I **sync point espliciti** sono due: Dev 1 manda un messaggio a Dev 3 quando il Prompt 5 funziona (porta il backend live), stessa cosa Dev 2 con il suo Prompt 7. Dev 3 aspetta entrambi i messaggi prima di fare il Prompt 8 (integrazione reale).
- **Dev 3** non si blocca mai in attesa — costruisce tutta la UI con i mock data, e solo nell'ultimo blocco swappa con le chiamate reali.