import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseClient.js';

export const pharmacyService = {
    // Busca as farmácias na coleção 'pharmacies' do Firestore.
    // Campos esperados por documento: nome, endereco, telefone, site, instagram, horario, bairro, tipo, lat, lng
    async getPharmacies() {
        try {
            const farmaciasQuery = query(collection(db, 'pharmacies'), orderBy('nome'));
            const snapshot = await getDocs(farmaciasQuery);
            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            return { data, error: null };
        } catch (error) {
            console.error("Erro ao buscar farmácias:", error.message);
            return { data: [], error };
        }
    }
};
