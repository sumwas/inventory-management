'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Stack,
  Typography,
  Button,
  Modal,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemToEdit, setItemToEdit] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
    setFilteredInventory(inventoryList)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }

  const incrementItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const updateItem = async (item, newName) => {
    const oldDocRef = doc(collection(firestore, 'inventory'), item)
    const newDocRef = doc(collection(firestore, 'inventory'), newName)
    const docSnap = await getDoc(oldDocRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(newDocRef, { quantity })
      if (item !== newName) {
        await deleteDoc(oldDocRef)
      }
    }
    await updateInventory()
  }

  const handleOpen = (item = null) => {
    setItemToEdit(item)
    if (item) {
      setItemName(item.name)
    } else {
      setItemName('')
    }
    setOpen(true)
  }

  const handleClose = () => {
    setItemToEdit(null)
    setOpen(false)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query === '') {
      setFilteredInventory(inventory)
    } else {
      setFilteredInventory(
        inventory.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase())
        )
      )
    }
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      padding={2}
      boxSizing="border-box"
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {itemToEdit ? 'Edit Item' : 'Add Item'}
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                if (itemToEdit) {
                  updateItem(itemToEdit.name, itemName)
                } else {
                  addItem(itemName)
                }
                setItemName('')
                handleClose()
              }}
            >
              {itemToEdit ? 'Update' : 'Add'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Box
        sx={{
          width: '100%',
          maxWidth: '800px',
          marginBottom: '16px',
          padding: '0 16px',
        }}
      >
        <TextField
          label="Search items"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          fullWidth
          sx={{ marginTop: '16px' }}
        />
      </Box>

      <Button variant="contained" onClick={() => handleOpen()}>
        Add New Item
      </Button>

      <Box
        sx={{
          width: '100%',
          maxWidth: '800px',
          height: 'calc(100vh - 160px)', // Adjust height based on other elements
          overflowY: 'auto',
          marginTop: 2,
        }}
      >
        <Grid container spacing={2}>
          {filteredInventory.map(({ name, quantity }) => (
            <Grid item xs={12} key={name}>
              <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2 }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                  <Typography component="div" variant="h5">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" component="div">
                    Quantity: {quantity}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => incrementItem(name)}>
                    <Add />
                  </IconButton>
                  <Button variant="contained" onClick={(e) => { e.stopPropagation(); handleOpen({ name, quantity }) }}>
                    Edit
                  </Button>
                  <Button variant="contained" onClick={(e) => { e.stopPropagation(); removeItem(name) }}>
                    Remove
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}
