import { UserProvider } from "../context/UserContext";
import AppRoutes from './routes/AppRoutes';
import './i18n/i18n';

const App = () => {
  return (
    <UserProvider>
      <AppRoutes>
      </AppRoutes>
    </UserProvider>
  );
}
export default App;
