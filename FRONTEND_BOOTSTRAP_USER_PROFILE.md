# 🔄 Recharger le profil (et la photo) après un rafraîchissement de page

Problème rencontré
------------------
La photo apparaît juste après la connexion mais disparaît lorsque l'utilisateur actualise la page (F5 / reload).

Cause
-----
Le **contexte / store** React est réinitialisé à chaque rechargement. Vous devez donc recharger les données utilisateur au démarrage de l'application.

Comme le backend place un cookie `auth_token` **httpOnly**, le navigateur l'envoie automatiquement à chaque requête – il suffit donc d'appeler `/auth/profile` ou `/auth/vendor/profile` pour récupérer à nouveau l'utilisateur et *profile_photo_url*.

Étapes d'implémentation
-----------------------

1. **Configurer Axios** pour envoyer les cookies :
   ```ts
   // src/api/axios.ts
   import axios from 'axios';
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     withCredentials: true, // ⬅️ important pour que le cookie soit transmis
   });
   export default api;
   ```

2. **Bootstrap du contexte** au montage de l'app :
   ```tsx
   // src/contexts/AuthContext.tsx (suite)
   import { useEffect } from 'react';
   import api from '@/api/axios';

   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       async function fetchProfile() {
         try {
           const res = await api.get('/auth/profile'); // cookie envoyé automatiquement
           setUser(res.data);
         } catch (_) {
           setUser(null); // non connecté ou cookie expiré
         } finally {
           setLoading(false);
         }
       }
       fetchProfile();
     }, []);

     if (loading) return <div className="h-screen flex items-center justify-center">Chargement…</div>;

     return (
       <AuthContext.Provider value={{ user, setUser }}>
         {children}
       </AuthContext.Provider>
     );
   }
   ```

3. **Afficher l'avatar** comme avant ; il sera mis à jour automatiquement dès que `user` est récupéré.

4. **Réutiliser le même endpoint** pour vérifier la session côté frontend :
   - Si la requête échoue (401), redirigez vers `/login`.

Conseils supplémentaires
-----------------------
* Si vous utilisez **React Query / TanStack Query** :
  ```ts
  const { data: user } = useQuery('me', () => api.get('/auth/profile').then(r => r.data));
  ```
  puis placez `user` dans un contexte ou passez-le par `useQuery` directement.

* Vous pouvez mémoriser temporairement la photo dans `localStorage` pour éviter un flash visuel pendant la requête, mais gardez la source de vérité côté API.

* Vérifiez que votre projet Vite / CRA dispose de :
  ```
  vite.config.ts  →  server: { cors: { origin: 'http://localhost:5173', credentials: true } }
  ```
  et que le backend NestJS a `credentials: true` dans la config CORS.

Avec cette logique de bootstrap, la photo (et tout le profil) reste présent même après un rafraîchissement de page, tant que la session est valide.  🎉 