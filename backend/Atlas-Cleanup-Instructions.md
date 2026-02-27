# MongoDB Atlas: How to safely delete the old "test" database

If your earlier test runs created collections inside a database named `test`, you can safely remove it to keep your environment clean.

**Follow these exact steps in your browser:**

1. Log in to your **MongoDB Atlas Dashboard** (https://cloud.mongodb.com/).
2. On the left sidebar under **Deployment**, click on **Database**.
3. You should see your cluster (e.g., `Cluster0`). Click on the **Browse Collections** button.
4. On the left side of the Collections view, you will see a list of your databases (you should see both `test` and `docuquery`).
5. Hover your mouse over the database named **`test`**.
6. A **trash can icon** (Drop Database) will appear next to the `test` database name. Click it.
7. A confirmation modal will appear. It will ask you to explicitly type the name of the database (`test`) to confirm the deletion.
8. Type `test` and click **Drop**.

*Note: Ensure you do NOT delete the `docuquery` database.*
