import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlaneTakeoff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import type { Department } from '../types';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  phone: string;
}

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  useEffect(() => {
    // Public departments list is protected in this API by default; if this call fails,
    // the dropdown will simply stay empty and the admin can assign a department later.
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data))
      .catch(() => setDepartments([]));
  }, []);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({ ...values, role: 'employee' } as any);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <PlaneTakeoff className="text-primary-500" size={40} />
          <h1 className="mt-2 text-xl font-bold text-center">Create Employee Account</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input className="input-field" {...register('name', { required: true })} />
            {errors.name && <p className="mt-1 text-xs text-red-500">Name is required</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" className="input-field" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" className="input-field" {...register('password', { required: true, minLength: 6 })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Department</label>
            <select className="input-field" {...register('department')}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <input className="input-field" placeholder="e.g. Technician" {...register('designation')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input className="input-field" {...register('phone')} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !mt-5">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
