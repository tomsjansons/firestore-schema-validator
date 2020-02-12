var firestore

function setFirestore(_firestore) {
  firestore = _firestore
}

function getFirestore() {
  return { firestore }
}

module.exports = {
  getFirestore,
  setFirestore
}
