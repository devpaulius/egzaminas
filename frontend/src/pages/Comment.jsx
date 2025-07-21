import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/api';

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    price: '',
    comment : '',
  });

  useEffect(() => {
    API.get(`/posts/${id}`).then(res => {
      setForm({
        title: res.data.title || '',
        price: res.data.price || '',
      });
    });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    API.post(`/posts/${id}/comment`, {
      comment: form.comment,
    }).then(() => navigate('/'));
  };

  return (
    <div>
      <h2>Comment</h2>
      <form onSubmit={handleSubmit}>
        <p>Title: {form.title}</p>
        <p>Price: {form.price} EUR</p>

        <textarea
          placeholder="Comment"
          value={form.comment}
          onChange={e => setForm({ ...form, comment: e.target.value })}
        />
        <button type="submit">Comment</button>
      </form>
    </div>
  );
}