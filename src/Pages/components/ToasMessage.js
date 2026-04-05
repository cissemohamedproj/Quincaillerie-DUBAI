import Swal from 'sweetalert2';

const showToastAlert = async (contentText) => {
  const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,

    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  toast.fire({
    icon: 'success',
    title: contentText,
    background: ' #343a40',
    color: '#fff',
  });
};

export default showToastAlert;
