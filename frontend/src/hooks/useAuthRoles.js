import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuthRoles = () => {
  const { currentEntity } = useContext(AuthContext);
  const isUser = currentEntity?.type === 'usuario';
  const isCuadrilla = currentEntity?.type === 'cuadrilla';
  const isAdmin = isUser && currentEntity?.data?.rol === 'Administrador';
  const id = currentEntity?.data?.id;
  const uid = currentEntity?.data?.uid;
  const nombre = currentEntity?.data?.nombre;
  return { id, uid, nombre, isAdmin, isUser, isCuadrilla };
};

export default useAuthRoles;
