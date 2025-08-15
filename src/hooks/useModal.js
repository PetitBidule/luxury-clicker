import { useContext, createContext } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children, showModal }) => {
  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
    </ModalContext.Provider>
  );
};
