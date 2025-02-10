import { UserProvider } from "../context/UserContext";
import AppRoutes from './routes/AppRoutes';
const App = () => {
  return (
    <UserProvider>
      <AppRoutes>
      </AppRoutes>
    </UserProvider>
  );
}
export default App;
