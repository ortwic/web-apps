<script lang="ts">
  import { writable } from 'svelte/store';
  import Table from './lib/Table.svelte'
  import { column } from './lib/templates/column.helper';
  
  const columns = [
    column('Name', 1, 'name', '20%', 'string'),
    column('Age', 2, 'age', '5%', 'number'),
    column('City', 3, 'city', '20%', 'string'),
    column('Country', 4, 'country', '20%', 'string'),
    column('Favorite color', 5, 'favoriteColor', '20%', 'string'),  
  ];

  const data = writable([
    { name: 'John', age: 20, city: 'New York', country: 'USA', favoriteColor: 'red' },
    { name: 'Jane', age: 25, city: 'Paris', country: 'France', favoriteColor: 'blue' },
    { name: 'Bob', age: 30, city: 'London', country: 'UK', favoriteColor: 'green' },
    { name: 'Alice', age: 35, city: 'Berlin', country: 'Germany', favoriteColor: 'yellow' },
    { name: 'Tom', age: 40, city: 'Tokyo', country: 'Japan', favoriteColor: 'purple' },
    { name: 'Sarah', age: 45, city: 'Moscow', country: 'Russia', favoriteColor: 'orange' },
    { name: 'Mike', age: 50, city: 'Sydney', country: 'Australia', favoriteColor: 'pink' },
    { name: 'Emily', age: 55, city: 'Paris', country: 'France', favoriteColor: 'brown' },
    { name: 'Olivia', age: 60, city: 'London', country: 'UK', favoriteColor: 'black' },
    { name: 'David', age: 65, city: 'Berlin', country: 'Germany', favoriteColor: 'white' },
    { name: 'Emma', age: 70, city: 'Tokyo', country: 'Japan', favoriteColor: 'gray' },
    { name: 'Michael', age: 75, city: 'Moscow', country: 'Russia', favoriteColor: 'purple' },
    { name: 'Lily', age: 80, city: 'Sydney', country: 'Australia', favoriteColor: 'orange' },
    { name: 'William', age: 85, city: 'Paris', country: 'France', favoriteColor: 'pink' },
    { name: 'Sophia', age: 90, city: 'London', country: 'UK', favoriteColor: 'brown' },
  ]);
</script>

<Table {columns} {data} idField="name" />
