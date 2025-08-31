import React, { useState } from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  useColorModeValue,
  Drawer,
  DrawerContent,
} from '@chakra-ui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();

  return (
    <Box minH="100vh" bg="dark.900">
      <Sidebar
        onClose={onClose}
        display={{ base: 'none', md: 'block' }}
      />
      
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>

      <Box ml={{ base: 0, md: 60 }}>
        <Header onOpen={onOpen} user={user} />
        
        <Box p={6}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;